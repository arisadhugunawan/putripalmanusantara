import { SUPPORTED_LOCALES } from '@ppn/shared-types';

/** i18n — non-English overrides, e.g. { "id": { "name": "...", ... }, "zh": {...} }.
 * Not deep-validated (admin-only input) — stored as-is in the `translations` JSON column. */
export type TranslationsInput = Record<string, Record<string, string>>;

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Phase P0.3-E (VAL-1) — normalizes a raw `translations` DTO value into a clean
 * `TranslationsInput`, filtering out structurally invalid data rather than rejecting the whole
 * admin request over it.
 *
 * Every translation-bearing DTO in this codebase has, until now, validated `translations` with
 * only `@IsOptional() @IsObject()` — a locale key outside `SUPPORTED_LOCALES`, a non-object
 * locale block, or a non-string field value has always been silently accepted and stored
 * verbatim in the JSON column. That was never a live bug: `resolveLocale()` only ever resolves
 * a request to a `SUPPORTED_LOCALES` member, and `translate()` only ever reads that one
 * resolved locale's fields, so any of the above was already fully inert dead weight, never
 * rendered anywhere (see the P0.3-E audit — a live query across every populated `translations`
 * column in the dev database found zero rows with an unknown locale key). This function closes
 * the write side the same way the read side already was: quietly, never failing a save over it.
 *
 * Filtering rules, applied in order:
 * - `undefined` → `undefined` — omitted from the patch, a no-op (matches
 *   `mergeTranslations()`'s own contract).
 * - `null` → `null` — also a no-op (`mergeTranslations()` treats `null` identically to
 *   `undefined`); passed through unchanged rather than coerced to `undefined` so a caller
 *   inspecting the raw value downstream still sees exactly what was sent.
 * - Anything else that isn't a plain object (array, string, number, boolean) → `undefined`.
 *   Never treated as if it were a locale-keyed object — an array's numeric indices are never
 *   mistaken for locale codes.
 * - Each top-level key not in `SUPPORTED_LOCALES` → dropped.
 * - Each surviving locale's value, if not itself a plain object → dropped (that whole locale is
 *   removed, not partially kept — e.g. `{ zh: "invalid" }` loses `zh` entirely).
 * - Within a surviving locale block, each field value that isn't a `string` → dropped. An empty
 *   string IS kept — `mergeTranslations()`'s own docs treat `""` as a deliberate, real value
 *   (e.g. an admin explicitly clearing one field back to its English fallback).
 * - Field NAMES are never validated or whitelisted here — whether "name"/"description"/
 *   "title"/… is a real field for a given model is that model's own DTO/mapper's concern
 *   (via `translate()`'s explicit field list), exactly as today. This function only enforces
 *   the shape (locale → field → string), never field semantics.
 * - An already-empty `{}`, or a locale block that ends up empty after filtering, is preserved
 *   as `{}` rather than deleted — matching today's behavior for a caller-supplied empty object
 *   exactly (harmless, and `mergeTranslations()` already treats an empty block as a no-op for
 *   that locale).
 *
 * Deliberately NOT done here (out of scope for this function, unchanged elsewhere):
 * - No HTML sanitization — `sanitizeRichText()`/`sanitizeTranslationsRichText()` already own
 *   that, independently of locale-key validity.
 * - No change to `translate()` or `mergeTranslations()` — both are untouched by this phase.
 */
export function normalizeTranslationsInput(
  value: unknown,
): TranslationsInput | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isPlainObject(value)) return undefined;

  const result: TranslationsInput = {};
  for (const [locale, block] of Object.entries(value)) {
    if (!SUPPORTED_LOCALE_SET.has(locale)) continue;
    if (!isPlainObject(block)) continue;

    const filteredBlock: Record<string, string> = {};
    for (const [field, fieldValue] of Object.entries(block)) {
      if (typeof fieldValue === 'string') {
        filteredBlock[field] = fieldValue;
      }
    }
    result[locale] = filteredBlock;
  }
  return result;
}
