import { toProductDetail, toProductSummary } from './product.mapper';

function stubProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    slug: 'semi-husked-coconut',
    name: 'Semi Husked Coconut',
    titleAccent: null,
    category: 'Semi Husked Coconut',
    shortDescription: 'Fresh semi-husked coconut, export grade.',
    fullDescription: 'Full description of the product.',
    coverImage: null,
    metaTitle: null,
    metaDescription: null,
    isFeatured: false,
    status: 'draft',
    order: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    gallery: [],
    shapes: [],
    specifications: [],
    packagingAndApps: [],
    downloads: [],
    ...overrides,
  };
}

function stubShape(overrides: Record<string, unknown> = {}) {
  return {
    id: 'shape-1',
    name: 'CUBE',
    media: null,
    sizes: '25x25x17 - (108 pcs/kg)',
    order: 0,
    translations: null,
    ...overrides,
  };
}

function stubSpec(overrides: Record<string, unknown> = {}) {
  return {
    id: 'spec-1',
    specKey: 'Moisture Content',
    specValue: '≤ 6%',
    order: 0,
    group: 'specification',
    variantLabel: null,
    translations: null,
    ...overrides,
  };
}

function stubPackaging(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pkg-1',
    type: 'packaging',
    title: 'Jute Gunny Bags',
    description: 'Standard export packaging.',
    media: null,
    order: 0,
    translations: null,
    ...overrides,
  };
}

// Phase P0.3-D — Product sub-model translations. `translate()` was already wired into the
// mapper for shapes/specifications/packaging before this phase; what was missing was the write
// path (DTO/service) and the raw `translations` passthrough these sub-models needed for the
// Admin to actually author them. These tests cover both: locale resolution (already correct,
// now exercised) and the new passthrough (this phase's actual change to the mapper).
// Products Multilingual — `titleAccent` was previously copied straight from the base row
// regardless of `locale`, unlike its sibling name/category/shortDescription fields, even though
// the `Product.translations` column already covers it. Fixed by adding `titleAccent` to the
// same `translate()` field list its siblings already use.
describe('toProductSummary — title_accent locale fallback', () => {
  it('falls back to the base (English) title_accent when no translation exists for the locale', () => {
    const product = stubProduct({ titleAccent: 'Premium Grade' });
    const result = toProductSummary(product as never, 'id');
    expect(result.title_accent).toBe('Premium Grade');
  });

  it('uses the translated title_accent when one exists for the requested locale', () => {
    const product = stubProduct({
      titleAccent: 'Premium Grade',
      translations: { id: { titleAccent: 'Kelas Premium' } },
    });
    const result = toProductSummary(product as never, 'id');
    expect(result.title_accent).toBe('Kelas Premium');
  });

  it('leaves title_accent as the base value for the default locale', () => {
    const product = stubProduct({
      titleAccent: 'Premium Grade',
      translations: { id: { titleAccent: 'Kelas Premium' } },
    });
    const result = toProductSummary(product as never, 'en');
    expect(result.title_accent).toBe('Premium Grade');
  });

  it('stays null when the product has no titleAccent at all', () => {
    const product = stubProduct({ titleAccent: null });
    expect(toProductSummary(product as never, 'id').title_accent).toBeNull();
  });
});

describe('toProductDetail — ProductShape locale resolution', () => {
  it('resolves the requested locale for name/sizes', () => {
    const product = stubProduct({
      shapes: [
        stubShape({
          translations: {
            id: { name: 'KUBUS', sizes: '25x25x17 - (108 pcs/kg) [ID]' },
          },
        }),
      ],
    });
    const en = toProductDetail(product as never, 'en');
    const id = toProductDetail(product as never, 'id');
    expect(en.shapes[0].name).toBe('CUBE');
    expect(id.shapes[0].name).toBe('KUBUS');
    expect(id.shapes[0].sizes).toBe('25x25x17 - (108 pcs/kg) [ID]');
  });

  it('falls back to the base name/sizes when the locale has no translation', () => {
    const product = stubProduct({
      shapes: [stubShape({ translations: { id: { name: 'KUBUS' } } })],
    });
    const result = toProductDetail(product as never, 'zh');
    expect(result.shapes[0].name).toBe('CUBE');
  });

  it('a legacy shape with translations = null resolves identically for every locale', () => {
    const product = stubProduct({
      shapes: [stubShape({ translations: null })],
    });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      expect(toProductDetail(product as never, locale).shapes[0].name).toBe(
        'CUBE',
      );
    }
  });

  it('carries the raw translations object through unchanged for the admin editor', () => {
    const translations = { id: { name: 'KUBUS' } };
    const product = stubProduct({ shapes: [stubShape({ translations })] });
    expect(
      toProductDetail(product as never, 'en').shapes[0].translations,
    ).toEqual(translations);
  });

  it('does not change non-translatable fields (order, media) across locales', () => {
    const product = stubProduct({
      shapes: [
        stubShape({ translations: { id: { name: 'KUBUS' } }, order: 3 }),
      ],
    });
    const en = toProductDetail(product as never, 'en').shapes[0];
    const id = toProductDetail(product as never, 'id').shapes[0];
    expect(id.order).toBe(en.order);
    expect(id.media).toBe(en.media);
  });
});

describe('toProductDetail — ProductSpecification locale resolution', () => {
  it('resolves the requested locale for spec_key/spec_value', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({
          translations: {
            id: { specKey: 'Kadar Air', specValue: '≤ 6% [ID]' },
          },
        }),
      ],
    });
    const en = toProductDetail(product as never, 'en');
    const id = toProductDetail(product as never, 'id');
    expect(en.specifications[0].spec_key).toBe('Moisture Content');
    expect(id.specifications[0].spec_key).toBe('Kadar Air');
    expect(id.specifications[0].spec_value).toBe('≤ 6% [ID]');
  });

  it('falls back to the base spec_key/spec_value when the locale has no translation', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({ translations: { id: { specKey: 'Kadar Air' } } }),
      ],
    });
    const result = toProductDetail(product as never, 'th');
    expect(result.specifications[0].spec_key).toBe('Moisture Content');
    expect(result.specifications[0].spec_value).toBe('≤ 6%');
  });

  it('a legacy specification with translations = null resolves identically for every locale (existing untranslated rows keep working)', () => {
    const product = stubProduct({
      specifications: [stubSpec({ translations: null })],
    });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      expect(
        toProductDetail(product as never, locale).specifications[0].spec_key,
      ).toBe('Moisture Content');
    }
  });

  it('carries the raw translations object through unchanged for the admin editor', () => {
    const translations = { id: { specKey: 'Kadar Air' } };
    const product = stubProduct({
      specifications: [stubSpec({ translations })],
    });
    expect(
      toProductDetail(product as never, 'en').specifications[0].translations,
    ).toEqual(translations);
  });

  it('does not change non-translatable fields (group, variant_label, order) across locales', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({
          translations: { id: { specKey: 'Kadar Air' } },
          group: 'export_info',
          variantLabel: 'Edible',
          order: 2,
        }),
      ],
    });
    const en = toProductDetail(product as never, 'en').specifications[0];
    const id = toProductDetail(product as never, 'id').specifications[0];
    expect(id.group).toBe(en.group);
    expect(id.variant_label).toBe(en.variant_label);
    expect(id.order).toBe(en.order);
  });
});

// Test fixtures below deliberately use a bracketed `[LOCALE]` suffix (matching this file's own
// existing `sizes: '... [ID]'` convention above) rather than real foreign-language commercial
// terminology — these tests verify locale-resolution LOGIC only, never real translated content.
describe('toProductDetail — ProductSpecification variant_label locale resolution', () => {
  it('returns the original English variant_label for the default locale', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({
          variantLabel: 'Edible (White Copra)',
          translations: { id: { variantLabel: 'Edible (White Copra) [ID]' } },
        }),
      ],
    });
    expect(
      toProductDetail(product as never, 'en').specifications[0].variant_label,
    ).toBe('Edible (White Copra)');
  });

  it.each(['id', 'zh', 'th', 'hi', 'vi'])(
    'resolves the translated variant_label for %s when present',
    (locale) => {
      const translated = `Edible (White Copra) [${locale.toUpperCase()}]`;
      const product = stubProduct({
        specifications: [
          stubSpec({
            variantLabel: 'Edible (White Copra)',
            translations: { [locale]: { variantLabel: translated } },
          }),
        ],
      });
      expect(
        toProductDetail(product as never, locale).specifications[0]
          .variant_label,
      ).toBe(translated);
    },
  );

  it('falls back to the base (English) variant_label when the requested locale has no translation', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({
          variantLabel: 'Edible (White Copra)',
          translations: { id: { variantLabel: 'Edible (White Copra) [ID]' } },
        }),
      ],
    });
    // zh has no translation entry at all for this row.
    expect(
      toProductDetail(product as never, 'zh').specifications[0].variant_label,
    ).toBe('Edible (White Copra)');
  });

  it('keeps variant_label null when the row has no variant (untranslated, ungrouped rows)', () => {
    const product = stubProduct({
      specifications: [stubSpec({ variantLabel: null, translations: null })],
    });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      expect(
        toProductDetail(product as never, locale).specifications[0]
          .variant_label,
      ).toBeNull();
    }
  });

  it('translating variant_label does not affect spec_key/spec_value for the same row', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({
          variantLabel: 'Edible (White Copra)',
          translations: { id: { variantLabel: 'Edible (White Copra) [ID]' } },
        }),
      ],
    });
    const result = toProductDetail(product as never, 'id').specifications[0];
    expect(result.variant_label).toBe('Edible (White Copra) [ID]');
    expect(result.spec_key).toBe('Moisture Content');
    expect(result.spec_value).toBe('≤ 6%');
  });

  it('translating spec_key/spec_value does not affect variant_label for the same row', () => {
    const product = stubProduct({
      specifications: [
        stubSpec({
          variantLabel: 'Edible (White Copra)',
          translations: { id: { specKey: 'Kadar Air' } },
        }),
      ],
    });
    const result = toProductDetail(product as never, 'id').specifications[0];
    expect(result.spec_key).toBe('Kadar Air');
    expect(result.variant_label).toBe('Edible (White Copra)');
  });
});

describe('toProductDetail — ProductPackagingApplication locale resolution', () => {
  it('resolves the requested locale for title/description', () => {
    const product = stubProduct({
      packagingAndApps: [
        stubPackaging({
          translations: {
            id: {
              title: 'Karung Goni',
              description: 'Kemasan ekspor standar.',
            },
          },
        }),
      ],
    });
    const en = toProductDetail(product as never, 'en');
    const id = toProductDetail(product as never, 'id');
    expect(en.packaging[0].title).toBe('Jute Gunny Bags');
    expect(id.packaging[0].title).toBe('Karung Goni');
    expect(id.packaging[0].description).toBe('Kemasan ekspor standar.');
  });

  it('falls back to the base title/description when the locale has no translation', () => {
    const product = stubProduct({
      packagingAndApps: [
        stubPackaging({ translations: { id: { title: 'Karung Goni' } } }),
      ],
    });
    const result = toProductDetail(product as never, 'hi');
    expect(result.packaging[0].title).toBe('Jute Gunny Bags');
    expect(result.packaging[0].description).toBe('Standard export packaging.');
  });

  it('a legacy packaging entry with translations = null resolves identically for every locale', () => {
    const product = stubProduct({
      packagingAndApps: [stubPackaging({ translations: null })],
    });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      expect(toProductDetail(product as never, locale).packaging[0].title).toBe(
        'Jute Gunny Bags',
      );
    }
  });

  it('carries the raw translations object through unchanged for the admin editor', () => {
    const translations = { id: { title: 'Karung Goni' } };
    const product = stubProduct({
      packagingAndApps: [stubPackaging({ translations })],
    });
    expect(
      toProductDetail(product as never, 'en').packaging[0].translations,
    ).toEqual(translations);
  });

  it('routes "application" type entries into `applications`, not `packaging`, unaffected by translations', () => {
    const product = stubProduct({
      packagingAndApps: [
        stubPackaging({
          type: 'application',
          title: 'Beverage Base',
          translations: { id: { title: 'Basis Minuman' } },
        }),
      ],
    });
    const id = toProductDetail(product as never, 'id');
    expect(id.packaging).toHaveLength(0);
    expect(id.applications[0].title).toBe('Basis Minuman');
  });
});
