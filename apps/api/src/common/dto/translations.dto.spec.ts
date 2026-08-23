import { normalizeTranslationsInput } from './translations.dto';

// Phase P0.3-E (VAL-1) — pilot phase: this is the shared normalizer only. No existing DTO has
// been wired to use it yet (still `@IsOptional() @IsObject()` everywhere, unchanged). These
// tests prove the function's behavior in isolation before any rollout.

describe('normalizeTranslationsInput', () => {
  // A. valid six locales remain unchanged
  it('passes all six supported locales through unchanged', () => {
    const input = {
      en: { name: 'English' },
      id: { name: 'Indonesian' },
      zh: { name: 'Chinese' },
      th: { name: 'Thai' },
      hi: { name: 'Hindi' },
      vi: { name: 'Vietnamese' },
    };
    expect(normalizeTranslationsInput(input)).toEqual(input);
  });

  // B. unknown locale is removed
  it('removes an unknown locale key', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Indonesia' },
      fr: { name: 'France' },
    });
    expect(result).toEqual({ id: { name: 'Indonesia' } });
    expect(result).not.toHaveProperty('fr');
  });

  // C. multiple valid locales survive
  it('keeps multiple valid locales when only some are invalid', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Indonesia' },
      zh: { name: '中国' },
      de: { name: 'Germany' },
      ja: { name: 'Japan' },
    });
    expect(result).toEqual({
      id: { name: 'Indonesia' },
      zh: { name: '中国' },
    });
  });

  // D. non-object locale block is removed
  it('removes a locale whose value is not an object', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Indonesia' },
      zh: 'invalid',
    });
    expect(result).toEqual({ id: { name: 'Indonesia' } });
  });

  it('removes a locale whose value is an array', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Indonesia' },
      zh: ['not', 'valid'],
    });
    expect(result).toEqual({ id: { name: 'Indonesia' } });
  });

  it('removes a locale whose value is null', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Indonesia' },
      zh: null,
    });
    expect(result).toEqual({ id: { name: 'Indonesia' } });
  });

  // E. non-string field value is removed
  it('removes a non-string field value (number)', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Valid', description: 123 },
    });
    expect(result).toEqual({ id: { name: 'Valid' } });
  });

  it('removes a non-string field value (nested object)', () => {
    const result = normalizeTranslationsInput({
      id: { name: 'Valid', other: { nested: true } },
    });
    expect(result).toEqual({ id: { name: 'Valid' } });
  });

  it('removes a non-string field value (boolean, array, null)', () => {
    const result = normalizeTranslationsInput({
      id: {
        name: 'Valid',
        flag: true,
        list: [1, 2, 3],
        empty: null,
      },
    });
    expect(result).toEqual({ id: { name: 'Valid' } });
  });

  // F. mixed valid + invalid input produces only valid data — the exact examples from the brief
  it("produces exactly the expected result for the brief's first example", () => {
    const input = {
      id: { name: 'Indonesia' },
      fr: { name: 'France' },
      zh: 'invalid',
    };
    expect(normalizeTranslationsInput(input)).toEqual({
      id: { name: 'Indonesia' },
    });
  });

  it("produces exactly the expected result for the brief's second example", () => {
    const input = {
      id: { name: 'Valid', description: 123, other: { nested: true } },
    };
    expect(normalizeTranslationsInput(input)).toEqual({
      id: { name: 'Valid' },
    });
  });

  // G. null input remains safe
  it('returns null for null input (matches mergeTranslations() no-op semantics)', () => {
    expect(normalizeTranslationsInput(null)).toBeNull();
  });

  // H. undefined input remains safe
  it('returns undefined for undefined input (matches mergeTranslations() no-op semantics)', () => {
    expect(normalizeTranslationsInput(undefined)).toBeUndefined();
  });

  // I. empty object remains safe
  it('returns {} unchanged for an already-empty object', () => {
    expect(normalizeTranslationsInput({})).toEqual({});
  });

  it('preserves a locale block that is empty after filtering, rather than deleting it', () => {
    const result = normalizeTranslationsInput({
      id: { description: 123 },
    });
    expect(result).toEqual({ id: {} });
    expect(result).toHaveProperty('id');
  });

  it('preserves a caller-supplied empty locale block unchanged', () => {
    expect(normalizeTranslationsInput({ id: {} })).toEqual({ id: {} });
  });

  // J. arrays are not accidentally accepted as translation objects
  it('treats a top-level array as invalid, not as a translations object', () => {
    expect(normalizeTranslationsInput(['id', 'zh'])).toBeUndefined();
  });

  it('does not mistake array indices for locale codes', () => {
    const result = normalizeTranslationsInput([{ name: 'x' }]);
    expect(result).toBeUndefined();
  });

  // K. nested objects are not accepted as field values (also covered under E, plus a
  // locale-keyed nested case)
  it('rejects a deeply nested object as a field value', () => {
    const result = normalizeTranslationsInput({
      id: { name: { first: 'a', last: 'b' } },
    });
    expect(result).toEqual({ id: {} });
  });

  // L. existing valid translation values are not modified
  it('does not alter valid string values, including empty strings and unicode', () => {
    const input = {
      id: { name: 'Produk Kelapa', description: '' },
      zh: { name: '椰子产品 🥥' },
    };
    expect(normalizeTranslationsInput(input)).toEqual(input);
  });

  // M. no field-name whitelist is accidentally introduced
  it('keeps any field name whose value is a string, without whitelisting known field names', () => {
    const result = normalizeTranslationsInput({
      id: {
        name: 'a',
        description: 'b',
        title: 'c',
        subtitle: 'd',
        alt: 'e',
        metaTitle: 'f',
        someCompletelyMadeUpFieldName: 'g',
      },
    });
    expect(result).toEqual({
      id: {
        name: 'a',
        description: 'b',
        title: 'c',
        subtitle: 'd',
        alt: 'e',
        metaTitle: 'f',
        someCompletelyMadeUpFieldName: 'g',
      },
    });
  });

  // Additional edge cases matching what @IsObject() currently accepts, made explicit and
  // intentional rather than incidental.
  it('treats a top-level string as invalid (not a translations object)', () => {
    expect(normalizeTranslationsInput('en')).toBeUndefined();
  });

  it('treats a top-level number as invalid', () => {
    expect(normalizeTranslationsInput(42)).toBeUndefined();
  });

  it('treats a top-level boolean as invalid', () => {
    expect(normalizeTranslationsInput(true)).toBeUndefined();
  });

  it('drops every locale when none are supported, returning an empty object (not undefined)', () => {
    const result = normalizeTranslationsInput({
      fr: { name: 'France' },
      de: { name: 'Germany' },
    });
    expect(result).toEqual({});
  });

  it('handles a fully realistic multi-locale, partially-malformed payload end to end', () => {
    const result = normalizeTranslationsInput({
      en: { name: 'Coconut' }, // en is itself a valid key, even though English is the base
      id: { name: 'Kelapa', shortDescription: 'Ekspor kelapa.' },
      zh: { name: '椰子', badField: 123 },
      xx: { name: 'Should be dropped entirely' },
      th: 'not-an-object',
      vi: { name: '', empty: '' },
    });
    expect(result).toEqual({
      en: { name: 'Coconut' },
      id: { name: 'Kelapa', shortDescription: 'Ekspor kelapa.' },
      zh: { name: '椰子' },
      vi: { name: '', empty: '' },
    });
  });
});
