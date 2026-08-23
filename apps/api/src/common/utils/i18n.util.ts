import { DEFAULT_LOCALE, isLocale } from '@ppn/shared-types';

/** The `translations` JSON column's shape everywhere in this codebase:
 * `{ [locale]: { [fieldName]: string } }`, field names matching the Prisma model's own
 * camelCase field names (never the API's snake_case) — see `translate()` below. */
export type TranslationsShape = Record<string, Record<string, string>>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

/**
 * Phase 5F-P0.3-A — the safe write-side counterpart to `translate()` above. Every
 * `create()`/`update()` in this codebase used to write `translations: dto.translations`
 * directly — a full-column REPLACE — which silently erases every locale/field the caller didn't
 * happen to include, unless the caller (today: every hand-written admin page, by convention, not
 * by any enforced contract) always resends the complete accumulated object. This function is
 * the enforced contract: a two-level deep merge — first by locale, then by field within that
 * locale — so a caller only ever needs to send the locale(s)/field(s) it actually changed.
 *
 * Example: `existing = { en: { title: "Title", description: "Description" } }`,
 * `incoming = { en: { title: "New Title" } }` → `{ en: { title: "New Title", description:
 * "Description" } }`. `description` survives because the merge happens one level deeper than a
 * naive `{ ...existing, ...incoming }` would go (that shallow form would have replaced the
 * entire `en` block, losing `description`).
 *
 * Semantics, deliberately conservative (never destroy data the caller didn't explicitly touch):
 * - `incoming === undefined` → returns `undefined`, meaning "field omitted from this
 *   PATCH — Prisma leaves the column untouched." This is a no-op, not a request to clear
 *   anything, matching how every other optional DTO field in this codebase already behaves.
 * - `incoming === null` → also returns `undefined` (same no-op as above). `null` is never
 *   treated as "explicitly clear every translation" — no caller in this codebase has ever
 *   needed that, and silently wiping six locales because a client sent `null` instead of
 *   omitting the key would be exactly the class of bug this function exists to prevent. A
 *   future "clear all translations" feature, if ever needed, should be its own explicit
 *   endpoint/flag, not an overloaded meaning of `null`.
 * - `incoming = {}` → every locale in `existing` is preserved untouched (there is nothing to
 *   overlay), so this is also effectively a no-op — not a "wipe everything" signal.
 * - A locale present in `incoming` but absent from `existing` → added as a new locale.
 * - A field present in `incoming[locale]` — including as `""` — overwrites that one field only;
 *   every other field already in `existing[locale]` is preserved. An explicit empty string is a
 *   real, deliberate value (e.g. an admin clearing just that field so it falls back to English
 *   at read time via `translate()`), not the same thing as omitting the key.
 * - A locale key in `incoming` that isn't one of `SUPPORTED_LOCALES`, or a value that isn't a
 *   plain object, is handled without throwing (non-object locale blocks are skipped; unknown
 *   locale keys are merged through as-is) — this function does not validate/reject unknown
 *   locales or malformed shapes, that's a separate, not-yet-implemented concern (see the P0.3
 *   audit's VAL-1 finding), deliberately out of scope here so this stays a pure, predictable
 *   merge primitive.
 *
 * Concurrency note: this is a plain in-memory merge — the caller is responsible for fetching
 * `existing` fresh immediately before calling this and writing the result back in the same
 * request. Two genuinely concurrent edits to the same row's `translations` (not merely two
 * edits to different locales — that case is exactly what this function fixes) can still race
 * between the read and the write, same as every other column on every row in this codebase; no
 * row-level locking exists anywhere here today, and adding one is a larger decision than this
 * function's scope. What this function guarantees is that a *sequential* partial update (the
 * overwhelmingly common case — one admin, one field, one save) can never lose sibling data,
 * which is the actual, confirmed failure mode the audit found.
 */
export function mergeTranslations(
  existing: unknown,
  incoming: TranslationsShape | null | undefined,
): TranslationsShape | undefined {
  if (incoming === undefined || incoming === null) return undefined;

  const existingObj = isPlainObject(existing)
    ? (existing as TranslationsShape)
    : {};
  const result: TranslationsShape = { ...existingObj };

  for (const [locale, incomingBlock] of Object.entries(incoming)) {
    if (!isPlainObject(incomingBlock)) continue;
    const existingBlock = isPlainObject(existingObj[locale])
      ? existingObj[locale]
      : {};
    result[locale] = { ...existingBlock, ...incomingBlock };
  }

  return result;
}
