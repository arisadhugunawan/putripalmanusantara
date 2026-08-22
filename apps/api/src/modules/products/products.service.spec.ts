import type { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiException } from '../../common/exceptions/api.exception';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { ProductsService } from './products.service';
import type { PrismaService } from '../../prisma/prisma.service';

const ACTOR = { id: 'admin-1', name: 'Ari' };

function buildService() {
  const product = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
    update: jest.fn<
      Promise<unknown>,
      [{ where: unknown; data: Record<string, unknown> }]
    >(),
    delete: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const productPublishedSnapshot = {
    create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
  };
  const prisma = {
    product,
    productPublishedSnapshot,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const events = { emit: jest.fn() };
  return {
    service: new ProductsService(
      prisma as unknown as PrismaService,
      events as unknown as EventEmitter2,
    ),
    product,
    productPublishedSnapshot,
    events,
  };
}

describe('ProductsService.publish', () => {
  it('creates version 1 and sets status=published for a never-published product', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1' }) // assertExists
      .mockResolvedValueOnce({ id: 'p1', slug: 'copra', gallery: [] }); // buildSnapshotData
    productPublishedSnapshot.findFirst.mockResolvedValue(null); // no prior version
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date('2026-08-21T00:00:00.000Z'),
    });
    product.update.mockResolvedValue({});

    const result = await service.publish('p1', ACTOR);

    expect(result).toEqual({
      id: 'snap-1',
      version: 1,
      published_at: '2026-08-21T00:00:00.000Z',
    });
    const [createArgs] = productPublishedSnapshot.create.mock.calls;
    const createData = createArgs[0].data;
    expect(createData).toMatchObject({
      productId: 'p1',
      version: 1,
      publishedById: 'admin-1',
      publishedByName: 'Ari',
    });
    const [updateArgs] = product.update.mock.calls;
    expect(updateArgs[0]).toMatchObject({
      where: { id: 'p1' },
      data: { status: 'published' },
    });
  });

  it('increments the version when a prior snapshot already exists', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1' })
      .mockResolvedValueOnce({ id: 'p1' });
    productPublishedSnapshot.findFirst.mockResolvedValue({ version: 3 });
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-4',
      version: 4,
      publishedAt: new Date(),
    });
    product.update.mockResolvedValue({});

    await service.publish('p1', ACTOR);

    const [call] = productPublishedSnapshot.create.mock.calls;
    expect(call[0].data).toMatchObject({ version: 4 });
  });

  it('emits content.published with source="products" and the product id after the snapshot/update transaction commits', async () => {
    const { service, product, productPublishedSnapshot, events } =
      buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1' })
      .mockResolvedValueOnce({ id: 'p1' });
    productPublishedSnapshot.findFirst.mockResolvedValue(null);
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    product.update.mockResolvedValue({});

    await service.publish('p1', ACTOR);

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'products',
      entityId: 'p1',
    });
  });
});

describe('ProductsService.restoreSnapshot', () => {
  it('creates a NEW snapshot row copying the source data, never mutating the source', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    const sourceData = { id: 'p1', slug: 'copra-old', name: 'Old Copra' };
    productPublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-2',
        productId: 'p1',
        data: sourceData,
      }) // source lookup
      .mockResolvedValueOnce({ version: 5 }); // latest version lookup
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-6',
      version: 6,
      publishedAt: new Date('2026-08-21T01:00:00.000Z'),
    });
    product.update.mockResolvedValue({});

    const result = await service.restoreSnapshot('p1', 'snap-2', ACTOR);

    expect(result.version).toBe(6);
    // A restore only ever appends a new row — the source snapshot is read (via findFirst)
    // and never passed to any write/update call anywhere in the service.
    expect(productPublishedSnapshot.create).toHaveBeenCalledTimes(1);
    const [call] = productPublishedSnapshot.create.mock.calls;
    expect(call[0].data).toMatchObject({
      data: sourceData,
      version: 6,
      productId: 'p1',
    });
  });

  it('throws NOT_FOUND when the snapshot does not belong to the given product', async () => {
    const { service, productPublishedSnapshot } = buildService();
    productPublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(
      service.restoreSnapshot('p1', 'snap-from-other-product', ACTOR),
    ).rejects.toThrow(ApiException);
  });

  // Phase 4.1: restore is a publish of an old payload — the public site changes exactly like a
  // fresh publish, so it must emit content.published too (previously scoped out in Phase 4).
  it('emits content.published with source="products" and the product id after the restore transaction commits', async () => {
    const { service, product, productPublishedSnapshot, events } =
      buildService();
    productPublishedSnapshot.findFirst
      .mockResolvedValueOnce({ id: 'snap-2', productId: 'p1', data: {} })
      .mockResolvedValueOnce({ version: 5 });
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-6',
      version: 6,
      publishedAt: new Date(),
    });
    product.update.mockResolvedValue({});

    await service.restoreSnapshot('p1', 'snap-2', ACTOR);

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'products',
      entityId: 'p1',
    });
  });

  it('does not emit content.published when the snapshot lookup fails (restore never starts)', async () => {
    const { service, productPublishedSnapshot, events } = buildService();
    productPublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(
      service.restoreSnapshot('p1', 'snap-missing', ACTOR),
    ).rejects.toThrow(ApiException);

    expect(events.emit).not.toHaveBeenCalled();
  });
});

describe('ProductsService — published data boundary', () => {
  it('findPublishedBySlug never falls back to the live row when status=published but no snapshot exists', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    product.findFirst.mockResolvedValue({ id: 'p1' });
    productPublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(service.findPublishedBySlug('copra')).rejects.toThrow(
      ApiException,
    );
  });

  it('findPublished never calls a mutating Product method', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    product.findMany.mockResolvedValue([]);
    productPublishedSnapshot.findMany.mockResolvedValue([]);

    await service.findPublished();

    expect(product.update).not.toHaveBeenCalled();
    expect(product.delete).not.toHaveBeenCalled();
  });
});

describe('ProductsService.update', () => {
  it('never writes status — only publish/unpublish/restoreSnapshot may change it', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' }); // assertExists
    product.update.mockResolvedValue({
      id: 'p1',
      gallery: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.update('p1', {
      status: 'published',
      name: 'New Name',
    });

    const call = product.update.mock.calls[0][0];
    expect(call.data).not.toHaveProperty('status');
  });
});

describe('ProductsService.remove', () => {
  it('converts a P2003 foreign-key violation into PRODUCT_HAS_PUBLISHED_HISTORY (409)', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' }); // assertExists
    product.delete.mockRejectedValue({ code: 'P2003' });

    let thrown: ApiException | undefined;
    try {
      await service.remove('p1');
    } catch (err) {
      thrown = err as ApiException;
    }
    expect(thrown).toBeInstanceOf(ApiException);
    expect(thrown?.code).toBe('PRODUCT_HAS_PUBLISHED_HISTORY');
    expect(thrown?.getStatus()).toBe(409);
  });
});

function stubProductRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    slug: 'copra',
    name: 'Copra',
    titleAccent: null,
    category: 'Copra',
    shortDescription: 'Short',
    fullDescription: 'Full',
    coverImage: null,
    metaTitle: null,
    metaDescription: null,
    isFeatured: false,
    status: 'published',
    order: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    translations: null,
    gallery: [],
    shapes: [],
    specifications: [],
    packagingAndApps: [],
    downloads: [],
    ...overrides,
  };
}

describe('ProductsService.findAllForAdminPaginated', () => {
  it('paginates using skip/take derived from page/limit and returns total-based meta', async () => {
    const { service, product } = buildService();
    product.findMany.mockResolvedValue([stubProductRow()]);
    product.count.mockResolvedValue(45);

    const result = await service.findAllForAdminPaginated({
      page: 3,
      limit: 20,
    });

    expect(product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
    expect(result.meta).toEqual({
      page: 3,
      limit: 20,
      total: 45,
      total_pages: 3,
    });
  });

  it('defaults to page 1 when only limit is given', async () => {
    const { service, product } = buildService();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({ limit: 20 });

    expect(product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it('searches name/category case-insensitively via q', async () => {
    const { service, product } = buildService();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      q: '  copra  ',
    });

    const [args] = product.findMany.mock.calls;
    expect(args[0].where).toEqual({
      OR: [
        { name: { contains: 'copra', mode: 'insensitive' } },
        { category: { contains: 'copra', mode: 'insensitive' } },
      ],
    });
  });

  it('filters by status', async () => {
    const { service, product } = buildService();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      status: 'draft',
    });

    const [args] = product.findMany.mock.calls;
    expect(args[0].where).toEqual({ status: 'draft' });
  });

  it('filters by featured — "false" must mean not-featured, not "any truthy string"', async () => {
    const { service, product } = buildService();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      featured: 'false',
    });

    const [args] = product.findMany.mock.calls;
    expect(args[0].where).toEqual({ isFeatured: false });
  });

  it('sorts by updatedAt desc by default', async () => {
    const { service, product } = buildService();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({ page: 1, limit: 20 });

    const [args] = product.findMany.mock.calls;
    expect(args[0].orderBy).toEqual({ updatedAt: 'desc' });
  });
});
