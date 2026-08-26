/**
 * Single source of truth for supported locales — mirrors the const-array pattern already
 * used by PRODUCT_CATEGORIES in product.ts. English is the default/fallback locale
 * (docs/01-prd.md §5.2 — public content is English-first; the other 5 are an explicit
 * scope addition on top of that, see README "Internationalization" section).
 */
export const SUPPORTED_LOCALES = ["en", "id", "zh", "th", "hi", "vi"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export interface LocaleLabel {
  name: string;
  flag: string;
}

export const LOCALE_LABELS: Record<Locale, LocaleLabel> = {
  en: { name: "English", flag: "🇬🇧" },
  id: { name: "Bahasa Indonesia", flag: "🇮🇩" },
  zh: { name: "中文", flag: "🇨🇳" },
  th: { name: "ไทย", flag: "🇹🇭" },
  hi: { name: "हिन्दी", flag: "🇮🇳" },
  vi: { name: "Tiếng Việt", flag: "🇻🇳" },
};

/** Non-English locales — the set that gets a `translations` JSON override, never the base row. */
export const TRANSLATABLE_LOCALES = SUPPORTED_LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
) as Exclude<Locale, "en">[];

/**
 * Shape of a translatable model's `translations` JSON column: one entry per non-English
 * locale, each holding string overrides for a subset of that model's translatable fields
 * (e.g. `{ id: { name: "...", shortDescription: "..." }, zh: { name: "..." } }`). Admin-only
 * — never deep-validated server-side, see each module's DTO comment.
 */
export type Translations = Partial<Record<Exclude<Locale, "en">, Record<string, string>>>;

/** POST .../translations/generate — generic across every translatable resource (Products,
 * Articles, Homepage sections, About Company, etc.), all built on the same AiProvider
 * abstraction as the public chat assistant. Degrades honestly to `available: false` if no AI
 * provider is configured (no API key) rather than fabricating translations. */
export type GenerateTranslationsResult =
  | { available: false; reason: "not_configured"; message: string }
  | {
      available: true;
      translated_locales: string[];
      /** The freshly generated translations for the locales just (re)translated — merge this
       * straight into local `translations` state rather than re-fetching the whole resource, so
       * an admin's unsaved edits in unrelated fields/tabs are never discarded. */
      translations: Translations;
      message: string;
    };

/** GET .../translation-status — one entry per non-English `SUPPORTED_LOCALES` member, letting
 * Admin see translation coverage without opening every LocaleTabs tab. Generic across every
 * translatable resource, same as `GenerateTranslationsResult` above. */
export type TranslationCoverage = "translated" | "partial" | "not_translated";

export interface TranslationStatusEntry {
  locale: string;
  status: TranslationCoverage;
  fields_translated: number;
  fields_total: number;
}
