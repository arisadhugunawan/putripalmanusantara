import { DEFAULT_LOCALE, isLocale } from '@ppn/shared-types';

/**
 * Resolves the `locale` query param against the shared locale list, defaulting to English
 * (docs §5.2) rather than throwing on an unrecognized value — a stray/typo'd locale should
 * degrade to the default, not break the page.
 */
export function resolveLocale(raw: unknown): string {
  return typeof raw === 'string' && isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * Applies the given entity's `translations` JSON column (shape:
 * `{ [locale]: { [field]: string } }`) over its English base fields for the requested
 * locale/fields. English source-of-truth fields are never touched; a missing/empty
 * translated value falls back to the base value field-by-field, not row-by-row, so a
 * partially-translated row still shows real content everywhere instead of blanks.
 */
export function translate<
  T extends Record<string, unknown>,
  K extends keyof T & string,
>(base: T, translations: unknown, locale: string, fields: readonly K[]): T {
  if (locale === DEFAULT_LOCALE) return base;
  if (!translations || typeof translations !== 'object') return base;

  const localeBlock = (translations as Record<string, unknown>)[locale];
  if (!localeBlock || typeof localeBlock !== 'object') return base;

  const result = { ...base };
  for (const field of fields) {
    const value = (localeBlock as Record<string, unknown>)[field];
    if (typeof value === 'string' && value.length > 0) {
      result[field] = value as T[K];
    }
  }
  return result;
}
