import { GalleryService } from './gallery.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const galleryItem = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const galleryCategory = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = { galleryItem, galleryCategory };
  return {
    service: new GalleryService(prisma as unknown as PrismaService),
    galleryItem,
    galleryCategory,
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
