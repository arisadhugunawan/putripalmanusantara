import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  TRANSLATABLE_LOCALES,
  type GenerateTranslationsResult,
  type Locale,
  type TranslationStatusEntry,
} from '@ppn/shared-types';
import {
  mergeTranslations,
  type TranslationsShape,
} from '../../common/utils/i18n.util';
import { AI_PROVIDER, type AiProvider } from './provider/ai-provider.interface';

export interface TranslateFieldsResult {
  /** False only when no AI provider is configured (no API key) — the honest "can't do this
   * right now" state, same semantic as `AiProvider.isConfigured()`. True even if the model's
   * response was unusable for one or all locales (see `translations` being empty in that case)
   * — a bad/empty model response is not the same failure as "there is no model to ask". */
  available: boolean;
  translations: Partial<Record<Locale, Record<string, string>>>;
}

/** Reusable AI-assisted "translate this content into every other locale" capability, built on
 * top of the same `AiProvider` abstraction the public chat assistant uses (§AR) — never a
 * separate machine-translation vendor. Content-type-agnostic: callers pass their own flat
 * `{fieldName: englishText}` map and get back `{locale: {fieldName: translatedText}}`, shaped
 * to drop straight into `mergeTranslations()`. First wired up for Products (see
 * `ProductsService.generateTranslations()`); any other module with a `translations` JSON
 * column can reuse this the same way. */
@Injectable()
export class AiTranslationService {
  private readonly logger = new Logger(AiTranslationService.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /** Convenience wrapper around `translateFields()` for the common "generate translations for
   * one resource's own row" case — every `XService.generateTranslations()` across this codebase
   * follows the exact same shape (check configured → translate the non-empty source fields into
   * every locale but the row's own → merge into whatever `translations` was already saved), so
   * this exists to keep each of those call sites down to "fetch my row, call this, save the
   * result if non-empty." Never writes anything itself — `mergedTranslations` is `undefined`
   * whenever nothing was actually generated (nothing to save), the caller decides whether/how
   * to persist it. */
  async generateAndMerge(
    sourceFields: Record<string, string>,
    existingTranslations: unknown,
    targetLocales: readonly Locale[] = TRANSLATABLE_LOCALES,
  ): Promise<{
    available: boolean;
    translatedLocales: string[];
    /** Only the freshly generated fields (never pre-existing sibling fields for that same
     * locale) — this is what a caller's HTTP response should return, so the frontend can merge
     * exactly what changed into local state without re-fetching. */
    generated: Partial<Record<Locale, Record<string, string>>>;
    /** The full column value to persist (existing + generated, deep-merged) — `undefined` when
     * nothing was generated, meaning there's nothing new to save. */
    mergedTranslations: TranslationsShape | undefined;
  }> {
    if (!this.provider.isConfigured()) {
      return {
        available: false,
        translatedLocales: [],
        generated: {},
        mergedTranslations: undefined,
      };
    }
    const { translations: generated } = await this.translateFields(
      sourceFields,
      targetLocales,
    );
    const translatedLocales = Object.keys(generated);
    const mergedTranslations =
      translatedLocales.length > 0
        ? mergeTranslations(existingTranslations, generated)
        : undefined;
    return {
      available: true,
      translatedLocales,
      generated,
      mergedTranslations,
    };
  }

  async translateFields(
    sourceFields: Record<string, string>,
    targetLocales: readonly Locale[],
  ): Promise<TranslateFieldsResult> {
    if (!this.provider.isConfigured()) {
      return { available: false, translations: {} };
    }

    const fieldNames = Object.keys(sourceFields).filter((key) =>
      sourceFields[key]?.trim(),
    );
    if (fieldNames.length === 0 || targetLocales.length === 0) {
      return { available: true, translations: {} };
    }

    const userMessage = JSON.stringify(
      Object.fromEntries(fieldNames.map((key) => [key, sourceFields[key]])),
    );

    const result: Partial<Record<Locale, Record<string, string>>> = {};
    // One Groq request per target locale, rather than one big request asking for every locale
    // at once. Groq's free tier enforces a hard tokens-per-minute ceiling on `openai/gpt-oss-20b`
    // (verified live: a single all-locales request for a large field set — About Company's
    // Profile — was rejected outright with HTTP 413 "Request too large... Limit 8000, Requested
    // 8504"; raising max_tokens further only makes that worse). Splitting per locale keeps each
    // request's footprint small enough to clear that ceiling regardless of how many
    // fields/locales a resource has. It also isolates failures: if the model garbles one
    // locale's output badly enough to break JSON.parse (observed with a Vietnamese response),
    // only that locale is lost instead of discarding every other, perfectly good one.
    for (const locale of targetLocales) {
      const systemPrompt = buildTranslationPrompt(fieldNames, locale);
      try {
        const raw = await this.provider.generateReply({
          systemPrompt,
          history: [],
          userMessage,
          maxOutputTokens: 3000,
        });
        const fields = parseLocaleResponse(raw, fieldNames);
        if (fields) result[locale] = fields;
      } catch (err) {
        this.logger.warn(
          `Translation generation failed for locale "${locale}": ${(err as Error).message}`,
        );
      }
    }
    return { available: true, translations: result };
  }
}

/** Spelled-out English language names for the prompt, rather than passing raw ISO codes —
 * verified live that a bare code like "vi" is unreliable (a Groq model given "vi" returned
 * Indonesian text instead of Vietnamese for one whole response), while naming the language
 * explicitly ("Vietnamese") got it right every time. */
const LOCALE_LANGUAGE_NAMES: Record<Exclude<Locale, 'en'>, string> = {
  id: 'Indonesian',
  zh: 'Chinese (Simplified)',
  th: 'Thai',
  hi: 'Hindi',
  vi: 'Vietnamese',
};

function buildTranslationPrompt(
  fieldNames: string[],
  targetLocale: Locale,
): string {
  const fieldList = fieldNames.map((f) => `"${f}"`).join(', ');
  const languageName =
    LOCALE_LANGUAGE_NAMES[targetLocale as Exclude<Locale, 'en'>] ??
    targetLocale;
  return (
    "You are a professional translator for an Indonesian coconut-export company's website CMS. " +
    `Translate the given English field values into ${languageName} (locale code: ` +
    `"${targetLocale}"), preserving meaning and tone for a B2B export/trade audience — do not ` +
    'add, omit, or embellish information. Respond with ONLY a single valid JSON object, no ' +
    'markdown code fences, no commentary before or after it, shaped exactly as: ' +
    '{ "<fieldName>": "<translated text>", ... } — containing exactly the field names ' +
    `[${fieldList}], with the field names left exactly as given (unchanged, English, ` +
    `lowercase) and only their values translated into ${languageName}.`
  );
}

/** Models sometimes wrap JSON in a ```json fence despite instructions, or add stray text
 * around it — recovered here rather than failing outright. Any field the model omitted, or
 * that isn't a non-empty string, is simply left out of the result (same as an admin who hasn't
 * translated that field yet) rather than treated as an error. Returns `null` when nothing
 * usable came back at all (e.g. malformed JSON), so the caller can skip this locale without
 * writing an empty object over any translation it already had. */
function parseLocaleResponse(
  raw: string,
  fieldNames: string[],
): Record<string, string> | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return null;

  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  const fields: Record<string, string> = {};
  for (const field of fieldNames) {
    const value = (data as Record<string, unknown>)[field];
    if (typeof value === 'string' && value.trim()) fields[field] = value;
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

/** Per-locale translation coverage for a resource's own fields — shared by every module's
 * `getTranslationStatus()` so each one only has to supply its own field-name/current-value map
 * (English master values, from the same row `translations` came from) rather than re-deriving
 * the SUPPORTED_LOCALES/status-bucketing logic. Only fields the English master itself actually
 * has content for are "expected" — an unset optional field shouldn't count as a missing
 * translation, or a resource would be permanently stuck at "partial". */
export function computeTranslationStatus(
  sourceFields: Record<string, string | null | undefined>,
  translations: unknown,
): TranslationStatusEntry[] {
  const translationsObj = (translations ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  const expectedFields = Object.keys(sourceFields).filter((field) => {
    const value = sourceFields[field];
    return typeof value === 'string' && value.trim() !== '';
  });

  return SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map(
    (locale) => {
      const block = translationsObj[locale] ?? {};
      const translatedCount = expectedFields.filter((field) => {
        const value = block[field];
        return typeof value === 'string' && value.trim() !== '';
      }).length;
      const status =
        expectedFields.length === 0 || translatedCount === expectedFields.length
          ? ('translated' as const)
          : translatedCount === 0
            ? ('not_translated' as const)
            : ('partial' as const);
      return {
        locale,
        status,
        fields_translated: translatedCount,
        fields_total: expectedFields.length,
      };
    },
  );
}

/** Shapes a `generateAndMerge()` result into the wire response every `generateXTranslations()`
 * route returns — shared so each module's controller/service pair only decides WHAT to
 * translate, never how to report the outcome. */
export function buildGenerateTranslationsResponse(
  available: boolean,
  translatedLocales: string[],
  generated: Partial<Record<Locale, Record<string, string>>>,
): GenerateTranslationsResult {
  if (!available) {
    return {
      available: false,
      reason: 'not_configured',
      message:
        'Automatic translation is not configured for this project. Enter translations manually using the language tabs above.',
    };
  }
  return {
    available: true,
    translated_locales: translatedLocales,
    translations: generated,
    message:
      translatedLocales.length > 0
        ? `Auto-translated into ${translatedLocales.length} language(s). Review and adjust below if needed.`
        : 'No translations were generated — please try again or fill in manually.',
  };
}

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(trimmed);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}
