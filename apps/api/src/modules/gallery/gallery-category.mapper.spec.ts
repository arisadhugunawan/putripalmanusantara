import { toGalleryCategory } from './gallery-category.mapper';
import type { GalleryCategoryModel as GalleryCategory } from '../../../generated/prisma/models';

function stubCategory(
  overrides: Partial<GalleryCategory> = {},
): GalleryCategory {
  return {
    id: 'cat-1',
    name: 'Sorting',
    slug: 'sorting',
    order: 0,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    ...overrides,
  };
}

// P0.3-C — the backend read path (mapper + public controller's `locale` query param) already
// existed before this phase; this admin-UI phase only added the LocaleTabs editor. These tests
// document and lock in the already-correct behavior they now expose in the Admin.
describe('toGalleryCategory — locale resolution', () => {
  it('returns the base (English) name for the default "en" locale', () => {
    const category = stubCategory({
      translations: { id: { name: 'Penyortiran' } },
    });
    expect(toGalleryCategory(category, 'en').name).toBe('Sorting');
  });

  it('resolves the requested locale', () => {
    const category = stubCategory({
      translations: { id: { name: 'Penyortiran' }, zh: { name: '分拣' } },
    });
    expect(toGalleryCategory(category, 'id').name).toBe('Penyortiran');
    expect(toGalleryCategory(category, 'zh').name).toBe('分拣');
  });

  it('falls back to the base name when the requested locale has no translation', () => {
    const category = stubCategory({
      translations: { id: { name: 'Penyortiran' } },
    });
    expect(toGalleryCategory(category, 'th').name).toBe('Sorting');
  });

  it('a legacy category with translations = null resolves identically for every locale (backward compatibility)', () => {
    const category = stubCategory({ translations: null });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      expect(toGalleryCategory(category, locale).name).toBe('Sorting');
    }
  });

  it('does not change non-translatable fields (slug, order, active) across locales', () => {
    const category = stubCategory({
      translations: { id: { name: 'Penyortiran' } },
      order: 3,
      active: false,
    });
    const en = toGalleryCategory(category, 'en');
    const id = toGalleryCategory(category, 'id');
    expect(id.slug).toBe(en.slug);
    expect(id.order).toBe(en.order);
    expect(id.active).toBe(en.active);
  });
});
