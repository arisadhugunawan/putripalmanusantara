import { SUPPORTED_LOCALES, type Locale, type Translations } from "@ppn/shared-types";

export interface TranslationStatusBadgesProps {
  /** The row's own `translations` JSON — non-English overrides keyed by locale. */
  translations: Translations | null | undefined;
  /** The row's English values, keyed by the same field names used inside
   * `translations[locale]` (the Prisma model's own camelCase field names — see each model's
   * schema doc comment — which may differ from this row's own snake_case API field names). */
  base: Record<string, string | null | undefined>;
}

/**
 * A non-English locale counts as complete only when every field that actually has English
 * content also has translated content — an English field left blank is optional, not missing,
 * so it never counts against completeness. Matches Products' existing server-side
 * `getTranslationStatus()` rule (products.service.ts), so "✓ vs ⚠" means the same thing
 * everywhere it appears instead of the six different "any field has some text" heuristics this
 * replaces (Phase 5D).
 */
export function getTranslationCompleteness(
  translations: Translations | null | undefined,
  base: Record<string, string | null | undefined>,
): Record<Exclude<Locale, "en">, boolean> {
  const expectedFields = Object.entries(base)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key]) => key);

  const result = {} as Record<Exclude<Locale, "en">, boolean>;
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === "en") continue;
    const block = translations?.[locale] ?? {};
    result[locale] =
      expectedFields.length === 0 ||
      expectedFields.every((field) => {
        const value = block[field];
        return typeof value === "string" && value.trim().length > 0;
      });
  }
  return result;
}

/** Compact per-locale completeness indicator — EN ✓ ID ✓ ZH ✓ TH ⚠ HI ⚠ VI ⚠. */
export function TranslationStatusBadges({ translations, base }: TranslationStatusBadgesProps) {
  const completeness = getTranslationCompleteness(translations, base);
  return (
    <span className="flex flex-wrap gap-1.5 text-[11px] font-medium normal-case tracking-normal text-neutral-500">
      {SUPPORTED_LOCALES.map((locale) => {
        const complete = locale === "en" || completeness[locale as Exclude<Locale, "en">];
        return (
          <span key={locale} className={complete ? "text-primary-700" : "text-amber-600"}>
            {locale.toUpperCase()} {complete ? "✓" : "⚠"}
          </span>
        );
      })}
    </span>
  );
}
