import { toProductDetail } from './product.mapper';

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
