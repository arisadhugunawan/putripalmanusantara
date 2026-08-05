/** i18n — non-English overrides, e.g. { "id": { "name": "...", ... }, "zh": {...} }.
 * Not deep-validated (admin-only input) — stored as-is in the `translations` JSON column. */
export type TranslationsInput = Record<string, Record<string, string>>;
