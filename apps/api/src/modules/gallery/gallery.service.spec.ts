import { GalleryService } from './gallery.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const galleryItem = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
  };
  const prisma = { galleryItem };
  return {
    service: new GalleryService(prisma as unknown as PrismaService),
    galleryItem,
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
