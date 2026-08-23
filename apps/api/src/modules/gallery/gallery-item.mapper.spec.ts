import { toGalleryItem } from './gallery-item.mapper';
import type {
  GalleryCategoryModel as GalleryCategory,
  GalleryItemModel as GalleryItem,
  MediaModel as Media,
} from '../../../generated/prisma/models';

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

function stubItem(
  overrides: Partial<
    GalleryItem & { media: Media | null; category: GalleryCategory }
  > = {},
): GalleryItem & { media: Media | null; category: GalleryCategory } {
  return {
    id: 'item-1',
    mediaType: 'image',
    mediaId: null,
    externalUrl: null,
    categoryId: 'cat-1',
    title: 'Coconut sorting line',
    caption: 'Workers sorting coconuts by size',
    altText: 'Coconut sorting line',
    location: 'Tolitoli',
    capturedAt: null,
    shortDescription: 'A quick look at our sorting process.',
    featured: false,
    active: true,
    order: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    media: null,
    category: stubCategory(),
    ...overrides,
  };
}

// P0.3-C — same purpose as gallery-category.mapper.spec.ts: the mapper/public-read locale
// resolution already existed; these tests document and lock in that already-correct behavior
// now that the Admin can actually author it.
describe('toGalleryItem — locale resolution', () => {
  const translations = {
    id: {
      title: 'Jalur penyortiran kelapa',
      caption: 'Pekerja menyortir kelapa berdasarkan ukuran',
      shortDescription: 'Sekilas proses penyortiran kami.',
    },
    zh: {
      title: '椰子分拣线',
      caption: '工人按大小分拣椰子',
      shortDescription: '我们分拣流程的简要介绍。',
    },
  };

  it('returns the base (English) title/caption/short_description for the default "en" locale', () => {
    const item = stubItem({ translations });
    const result = toGalleryItem(item, 'en');
    expect(result.title).toBe('Coconut sorting line');
    expect(result.caption).toBe('Workers sorting coconuts by size');
    expect(result.short_description).toBe(
      'A quick look at our sorting process.',
    );
  });

  it('resolves the requested locale for title/caption/short_description', () => {
    const item = stubItem({ translations });
    const id = toGalleryItem(item, 'id');
    expect(id.title).toBe('Jalur penyortiran kelapa');
    expect(id.caption).toBe('Pekerja menyortir kelapa berdasarkan ukuran');
    expect(id.short_description).toBe('Sekilas proses penyortiran kami.');

    const zh = toGalleryItem(item, 'zh');
    expect(zh.title).toBe('椰子分拣线');
  });

  it('falls back to the base fields when the requested locale has no translation', () => {
    const item = stubItem({ translations });
    const result = toGalleryItem(item, 'th');
    expect(result.title).toBe('Coconut sorting line');
    expect(result.short_description).toBe(
      'A quick look at our sorting process.',
    );
  });

  it('a legacy item with translations = null resolves identically for every locale (backward compatibility)', () => {
    const item = stubItem({ translations: null });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      expect(toGalleryItem(item, locale).title).toBe('Coconut sorting line');
    }
  });

  it('never translates alt_text — it is not in the translatable field set', () => {
    const item = stubItem({
      translations: { id: { altText: 'Should never apply' } },
      altText: 'Coconut sorting line',
    });
    expect(toGalleryItem(item, 'id').alt_text).toBe('Coconut sorting line');
  });

  it('the resolved category name also reflects the requested locale (nested translate)', () => {
    const item = stubItem({
      category: stubCategory({ translations: { id: { name: 'Penyortiran' } } }),
    });
    expect(toGalleryItem(item, 'id').category.name).toBe('Penyortiran');
    expect(toGalleryItem(item, 'en').category.name).toBe('Sorting');
  });

  it('does not change non-translatable fields (location, featured, active, order) across locales', () => {
    const item = stubItem({
      translations,
      location: 'Palu',
      featured: true,
      order: 4,
    });
    const en = toGalleryItem(item, 'en');
    const id = toGalleryItem(item, 'id');
    expect(id.location).toBe(en.location);
    expect(id.featured).toBe(en.featured);
    expect(id.active).toBe(en.active);
    expect(id.order).toBe(en.order);
  });
});
