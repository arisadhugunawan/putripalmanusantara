import { GalleryService } from './gallery.service';
import type { AiTranslationService } from '../ai/ai-translation.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const galleryItem = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const galleryCategory = {
    findUnique: jest
      .fn<Promise<unknown>, unknown[]>()
      .mockResolvedValue(stubGalleryCategoryRow()),
    count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    delete: jest.fn<Promise<unknown>, unknown[]>(),
  };
  // P0.4-D2 — assertMediaValid() looks up `prisma.media`; defaults to "exists" so every
  // pre-existing test above (none of which cares about media validation) keeps working
  // unchanged, and only the new tests below override it explicitly.
  const media = {
    findUnique: jest
      .fn<Promise<unknown>, unknown[]>()
      .mockResolvedValue({ id: 'm1' }),
  };
  const prisma = { galleryItem, galleryCategory, media };
  return {
    service: new GalleryService(
      prisma as unknown as PrismaService,
      {} as unknown as AiTranslationService,
    ),
    galleryItem,
    galleryCategory,
    media,
  };
}

function stubGalleryCategoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name: 'Warehouse',
    slug: 'warehouse',
    order: 0,
    active: true,
    translations: null,
    ...overrides,
  };
}

function stubGalleryItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g1',
    mediaType: 'image',
    mediaId: 'm1',
    media: null,
    externalUrl: null,
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Warehouse',
      slug: 'warehouse',
      order: 0,
      active: true,
      translations: null,
    },
    title: 'Warehouse floor',
    caption: null,
    altText: null,
    location: null,
    capturedAt: null,
    shortDescription: null,
    featured: false,
    active: true,
    order: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    ...overrides,
  };
}

describe('GalleryService.findAllPaginated', () => {
  it('paginates using skip/take derived from page/limit and returns total-based meta, sorted by order asc', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findMany.mockResolvedValue([stubGalleryItemRow()]);
    galleryItem.count.mockResolvedValue(63);

    const result = await service.findAllPaginated({
      page: 2,
      limit: 50,
    });

    expect(galleryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 50,
        orderBy: { order: 'asc' },
      }),
    );
    expect(result.meta).toEqual({
      page: 2,
      limit: 50,
      total: 63,
      total_pages: 2,
    });
  });

  it('filters by category_id', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findMany.mockResolvedValue([]);
    galleryItem.count.mockResolvedValue(0);

    await service.findAllPaginated({
      page: 1,
      limit: 50,
      category_id: 'cat-1',
    });

    const [args] = galleryItem.findMany.mock.calls;
    expect(args[0].where).toMatchObject({ categoryId: 'cat-1' });
  });

  it('filters by status=inactive as active:false', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findMany.mockResolvedValue([]);
    galleryItem.count.mockResolvedValue(0);

    await service.findAllPaginated({
      page: 1,
      limit: 50,
      status: 'inactive',
    });

    const [args] = galleryItem.findMany.mock.calls;
    expect(args[0].where).toMatchObject({ active: false });
  });

  it('searches title/caption/location/short description via q', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findMany.mockResolvedValue([]);
    galleryItem.count.mockResolvedValue(0);

    await service.findAllPaginated({
      page: 1,
      limit: 50,
      q: '  drone  ',
    });

    const args = galleryItem.findMany.mock.calls[0] as [
      { where: { OR: unknown } },
    ];
    expect(args[0].where.OR).toEqual([
      { title: { contains: 'drone', mode: 'insensitive' } },
      { caption: { contains: 'drone', mode: 'insensitive' } },
      { location: { contains: 'drone', mode: 'insensitive' } },
      { shortDescription: { contains: 'drone', mode: 'insensitive' } },
    ]);
  });
});

// Phase 5F-P0.3-A — GalleryService had zero translation-behavior tests before this phase
// (confirmed by the P0.3 translation audit). Both updateCategory() and item update() previously
// wrote `translations: dto.translations` as a straight column replace; both now merge against
// the row's existing translations first.
describe('GalleryService.updateCategory — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique.mockResolvedValue(
      stubGalleryCategoryRow({
        translations: {
          id: { name: 'Gudang' },
          zh: { name: '仓库' },
        },
      }),
    );
    galleryCategory.update.mockResolvedValue(stubGalleryCategoryRow());

    await service.updateCategory('cat-1', {
      translations: { th: { name: 'คลังสินค้า' } },
    });

    const [call] = galleryCategory.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({ name: 'คลังสินค้า' });
    expect(call.data.translations.id).toEqual({ name: 'Gudang' });
    expect(call.data.translations.zh).toEqual({ name: '仓库' });
  });
});

describe('GalleryService.update (item) — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findUnique.mockResolvedValue(
      stubGalleryItemRow({
        translations: {
          id: { title: 'Lantai gudang', caption: 'Keterangan ID' },
          zh: { title: '仓库地板' },
        },
      }),
    );
    galleryItem.update.mockResolvedValue(stubGalleryItemRow());

    await service.update('g1', {
      translations: { th: { title: 'พื้นคลังสินค้า' } },
    });

    const [call] = galleryItem.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({ title: 'พื้นคลังสินค้า' });
    expect(call.data.translations.id).toEqual({
      title: 'Lantai gudang',
      caption: 'Keterangan ID',
    });
    expect(call.data.translations.zh).toEqual({ title: '仓库地板' });
  });

  it('a single-field edit preserves sibling fields already saved in that same locale', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findUnique.mockResolvedValue(
      stubGalleryItemRow({
        translations: { vi: { title: 'Tiêu đề cũ', caption: 'Chú thích' } },
      }),
    );
    galleryItem.update.mockResolvedValue(stubGalleryItemRow());

    await service.update('g1', {
      translations: { vi: { title: 'Tiêu đề mới' } },
    });

    const [call] = galleryItem.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.vi).toEqual({
      title: 'Tiêu đề mới',
      caption: 'Chú thích',
    });
  });

  it('omitting translations from the patch leaves the column untouched', async () => {
    const { service, galleryItem } = buildService();
    galleryItem.findUnique.mockResolvedValue(
      stubGalleryItemRow({ translations: { id: { title: 'T' } } }),
    );
    galleryItem.update.mockResolvedValue(stubGalleryItemRow());

    await service.update('g1', { title: 'New title' });

    const [call] = galleryItem.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });
});

// P0.4-D2 — create()/update() previously wrote `dto.media_id` straight into the Prisma call
// with no existence check at all, unlike `category_id`, which is validated via
// `assertCategoryValid()` in the very same file. A stale/deleted media id (picked in one tab,
// removed from the Media Library in another) fell through to an unhandled FK violation → raw
// 500. `assertMediaValid()` mirrors `assertCategoryValid()` exactly.
describe('GalleryService.create/update — media_id validation (P0.4-D2)', () => {
  it('create: throws INVALID_MEDIA (400) for a nonexistent media_id', async () => {
    const { service, media } = buildService();
    media.findUnique.mockResolvedValue(null);

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.create({
        category_id: 'cat-1',
        media_id: 'missing-media',
      });
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('INVALID_MEDIA');
    expect(thrown?.getStatus?.()).toBe(400);
  });

  it('create: a valid media_id proceeds exactly as before', async () => {
    const { service, galleryItem, media } = buildService();
    media.findUnique.mockResolvedValue({ id: 'm1' });
    galleryItem.count.mockResolvedValue(0);
    galleryItem.create.mockResolvedValue(stubGalleryItemRow());

    const result = await service.create({
      category_id: 'cat-1',
      media_id: 'm1',
    });

    expect(result.id).toBe('g1');
  });

  it('create: youtube/tiktok items skip media validation entirely (no media_id ever written)', async () => {
    const { service, galleryItem, media } = buildService();
    galleryItem.count.mockResolvedValue(0);
    galleryItem.create.mockResolvedValue(
      stubGalleryItemRow({ mediaType: 'youtube', mediaId: null }),
    );

    await service.create({
      category_id: 'cat-1',
      media_type: 'youtube',
      external_url: 'https://youtube.com/watch?v=abc',
    } as never);

    expect(media.findUnique).not.toHaveBeenCalled();
  });

  it('update: throws INVALID_MEDIA (400) for a nonexistent media_id', async () => {
    const { service, galleryItem, media } = buildService();
    galleryItem.findUnique.mockResolvedValue(stubGalleryItemRow());
    media.findUnique.mockResolvedValue(null);

    let thrown: { code?: string } | undefined;
    try {
      await service.update('g1', { media_id: 'missing-media' });
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('INVALID_MEDIA');
  });

  it('update: a valid media_id proceeds exactly as before', async () => {
    const { service, galleryItem, media } = buildService();
    galleryItem.findUnique.mockResolvedValue(stubGalleryItemRow());
    media.findUnique.mockResolvedValue({ id: 'm2' });
    galleryItem.update.mockResolvedValue(stubGalleryItemRow({ mediaId: 'm2' }));

    const result = await service.update('g1', { media_id: 'm2' });

    expect(result.id).toBe('g1');
  });

  it('update: omitting media_id from the patch never triggers a media lookup', async () => {
    const { service, galleryItem, media } = buildService();
    galleryItem.findUnique.mockResolvedValue(stubGalleryItemRow());
    galleryItem.update.mockResolvedValue(stubGalleryItemRow());

    await service.update('g1', { title: 'New title' });

    expect(media.findUnique).not.toHaveBeenCalled();
  });
});

// P0.4-D3 — removeCategory() checks itemCount then deletes; an item inserted into the category
// in the window between those two calls previously produced an unhandled FK-restrict violation
// (raw 500) instead of the existing CATEGORY_NOT_EMPTY 409 the synchronous check already
// returns. This wraps the delete to catch that race and re-throw the same existing contract.
describe('GalleryService.removeCategory — TOCTOU protection (P0.4-D3)', () => {
  it('an empty category (count=0) deletes successfully, unchanged', async () => {
    const { service, galleryItem, galleryCategory } = buildService();
    galleryItem.count.mockResolvedValue(0);
    galleryCategory.delete.mockResolvedValue({});

    const result = await service.removeCategory('cat-1');

    expect(result).toEqual({ deleted: true });
    expect(galleryCategory.delete).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
    });
  });

  it('a non-empty category (count>0) still 409s synchronously, unchanged, delete never attempted', async () => {
    const { service, galleryItem, galleryCategory } = buildService();
    galleryItem.count.mockResolvedValue(3);

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.removeCategory('cat-1');
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('CATEGORY_NOT_EMPTY');
    expect(thrown?.getStatus?.()).toBe(409);
    expect(galleryCategory.delete).not.toHaveBeenCalled();
  });

  it('count=0 but delete rejects with a P2003 shape (item inserted mid-race) → still 409 CATEGORY_NOT_EMPTY', async () => {
    const { service, galleryItem, galleryCategory } = buildService();
    galleryItem.count.mockResolvedValue(0);
    galleryCategory.delete.mockRejectedValue({ code: 'P2003' });

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.removeCategory('cat-1');
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('CATEGORY_NOT_EMPTY');
    expect(thrown?.getStatus?.()).toBe(409);
  });

  it('count=0 but delete rejects with the P2039/originalCode=23001 driver-adapter shape → still 409 CATEGORY_NOT_EMPTY', async () => {
    const { service, galleryItem, galleryCategory } = buildService();
    galleryItem.count.mockResolvedValue(0);
    galleryCategory.delete.mockRejectedValue({
      code: 'P2039',
      meta: { driverAdapterError: { cause: { originalCode: '23001' } } },
    });

    let thrown: { code?: string } | undefined;
    try {
      await service.removeCategory('cat-1');
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('CATEGORY_NOT_EMPTY');
  });

  it('an unrelated delete error is re-thrown unchanged, not swallowed into CATEGORY_NOT_EMPTY', async () => {
    const { service, galleryItem, galleryCategory } = buildService();
    galleryItem.count.mockResolvedValue(0);
    const otherError = new Error('connection lost');
    galleryCategory.delete.mockRejectedValue(otherError);

    await expect(service.removeCategory('cat-1')).rejects.toBe(otherError);
  });
});

// P2-1 — `uniqueCategorySlug()` is a check-then-act read-loop; these tests prove
// `createCategory()`'s actual write is now also guarded against the TOCTOU race window where
// two concurrent requests both see the same slug as free before either commits.
// GalleryCategory's existing "always succeeds, auto-suffix on collision" UX is preserved
// exactly — a recognized conflict re-resolves the next available suffix and retries, it never
// becomes a user-facing error. `updateCategory()` never writes `slug` (immutable after
// creation, confirmed by `UpdateGalleryCategoryDto` having no `slug` field at all), so it has
// no equivalent race and is intentionally left unguarded.
//
// Note: `buildService()`'s `galleryCategory.findUnique` defaults to resolving a truthy stub row
// (for `assertCategoryExists()`'s convenience elsewhere in this file) — every test below must
// therefore explicitly sequence its slug-availability checks, ending in a `null`/falsy
// resolution, or `uniqueCategorySlug()`'s while-loop would never terminate.
describe('GalleryService.createCategory — slug uniqueness race hardening (P2-1)', () => {
  it('1. a normal create with no collision uses the requested slug as-is', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique.mockResolvedValueOnce(null); // uniqueCategorySlug: free
    galleryCategory.create.mockResolvedValueOnce(
      stubGalleryCategoryRow({ slug: 'test-category' }),
    );

    await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    expect(galleryCategory.create).toHaveBeenCalledTimes(1);
    const [call] = galleryCategory.create.mock.calls[0] as [
      { data: { slug: string } },
    ];
    expect(call.data.slug).toBe('test-category');
  });

  it('2. the existing uniqueCategorySlug() mechanism still resolves a pre-existing collision to -2, with no P2002 involved', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique
      .mockResolvedValueOnce(stubGalleryCategoryRow()) // 'test-category' taken
      .mockResolvedValueOnce(null); // 'test-category-2' free
    galleryCategory.create.mockResolvedValueOnce(
      stubGalleryCategoryRow({ slug: 'test-category-2' }),
    );

    await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    expect(galleryCategory.create).toHaveBeenCalledTimes(1);
    const [call] = galleryCategory.create.mock.calls[0] as [
      { data: { slug: string } },
    ];
    expect(call.data.slug).toBe('test-category-2');
  });

  it('3. a P2002 unique-violation on the actual create() triggers a retry', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique
      .mockResolvedValueOnce(null) // first uniqueCategorySlug: free
      .mockResolvedValueOnce(stubGalleryCategoryRow()) // retry: 'test-category' now taken
      .mockResolvedValueOnce(null); // 'test-category-2' free
    galleryCategory.create
      .mockRejectedValueOnce(
        Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
          meta: { target: ['slug'] },
        }),
      )
      .mockResolvedValueOnce(
        stubGalleryCategoryRow({ slug: 'test-category-2' }),
      );

    await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    expect(galleryCategory.create).toHaveBeenCalledTimes(2);
  });

  it('4. the retry after a P2002 succeeds with the next available suffix and returns the created category', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(stubGalleryCategoryRow())
      .mockResolvedValueOnce(null);
    galleryCategory.create
      .mockRejectedValueOnce(
        Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
          meta: { target: ['slug'] },
        }),
      )
      .mockResolvedValueOnce(
        stubGalleryCategoryRow({ slug: 'test-category-2' }),
      );

    const result = await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    const [, secondCall] = galleryCategory.create.mock.calls as [
      unknown,
      [{ data: { slug: string } }],
    ];
    expect(secondCall[0].data.slug).toBe('test-category-2');
    expect(result.slug).toBe('test-category-2');
  });

  it('5. the Prisma 7 driver-adapter fallback (P2039 + originalCode 23505) on create() also triggers a retry', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(stubGalleryCategoryRow())
      .mockResolvedValueOnce(null);
    galleryCategory.create
      .mockRejectedValueOnce(
        Object.assign(new Error('unmapped'), {
          code: 'P2039',
          meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
        }),
      )
      .mockResolvedValueOnce(
        stubGalleryCategoryRow({ slug: 'test-category-2' }),
      );

    const result = await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    expect(galleryCategory.create).toHaveBeenCalledTimes(2);
    expect(result.slug).toBe('test-category-2');
  });

  it('6. multiple consecutive collisions on the actual write advance the suffix correctly', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique
      .mockResolvedValueOnce(null) // first uniqueCategorySlug: 'test-category' free
      // retry #1: 'test-category' taken, 'test-category-2' free
      .mockResolvedValueOnce(stubGalleryCategoryRow())
      .mockResolvedValueOnce(null)
      // retry #2: 'test-category' taken, 'test-category-2' taken, 'test-category-3' free
      .mockResolvedValueOnce(stubGalleryCategoryRow())
      .mockResolvedValueOnce(stubGalleryCategoryRow())
      .mockResolvedValueOnce(null);
    galleryCategory.create
      .mockRejectedValueOnce(
        Object.assign(new Error('boom'), {
          code: 'P2002',
          meta: { target: ['slug'] },
        }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error('boom'), {
          code: 'P2002',
          meta: { target: ['slug'] },
        }),
      )
      .mockResolvedValueOnce(
        stubGalleryCategoryRow({ slug: 'test-category-3' }),
      );

    const result = await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    expect(galleryCategory.create).toHaveBeenCalledTimes(3);
    const [, , thirdCall] = galleryCategory.create.mock.calls as [
      unknown,
      unknown,
      [{ data: { slug: string } }],
    ];
    expect(thirdCall[0].data.slug).toBe('test-category-3');
    expect(result.slug).toBe('test-category-3');
  });

  it('7. an unrelated Prisma error on create is re-thrown unchanged, never treated as a slug retry', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique.mockResolvedValueOnce(null);
    const unrelated = Object.assign(new Error('connection lost'), {
      code: 'P1001',
    });
    galleryCategory.create.mockRejectedValueOnce(unrelated);

    await expect(
      service.createCategory({
        name: 'Test Category',
        slug: 'test-category',
      }),
    ).rejects.toBe(unrelated);
    expect(galleryCategory.create).toHaveBeenCalledTimes(1);
  });

  it('8. the retry loop is bounded and cannot loop forever — it rethrows the last recognized conflict once the limit is exhausted', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique.mockResolvedValue(null); // every uniqueCategorySlug() call sees it as free
    const persistentConflict = Object.assign(new Error('always conflicts'), {
      code: 'P2002',
      meta: { target: ['slug'] },
    });
    galleryCategory.create.mockRejectedValue(persistentConflict);

    await expect(
      service.createCategory({
        name: 'Test Category',
        slug: 'test-category',
      }),
    ).rejects.toBe(persistentConflict);
    // MAX_SLUG_RETRY_ATTEMPTS (5) retries + the original attempt = 6 total calls, then it gives up.
    expect(galleryCategory.create).toHaveBeenCalledTimes(6);
  });

  it('9. updateCategory() remains slug-immutable — no slug key is ever written, and no slug-retry behavior was added', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.update.mockResolvedValueOnce(stubGalleryCategoryRow());

    await service.updateCategory('cat-1', { name: 'New Name' });

    expect(galleryCategory.update).toHaveBeenCalledTimes(1);
    const [call] = galleryCategory.update.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(call.data).not.toHaveProperty('slug');
  });

  it('a successful create with no collision is completely unaffected by the new retry loop', async () => {
    const { service, galleryCategory } = buildService();
    galleryCategory.findUnique.mockResolvedValueOnce(null);
    galleryCategory.create.mockResolvedValueOnce(
      stubGalleryCategoryRow({ slug: 'test-category' }),
    );

    const result = await service.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    });

    expect(galleryCategory.create).toHaveBeenCalledTimes(1);
    expect(result.slug).toBe('test-category');
  });
});
