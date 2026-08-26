import type { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiException } from '../../common/exceptions/api.exception';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { ProductsService } from './products.service';
import { toProductDetail } from './product.mapper';
import type { PrismaService } from '../../prisma/prisma.service';

const ACTOR = { id: 'admin-1', name: 'Ari' };

function buildService() {
  const product = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
    create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
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
  // Default resolves to no rows — every existing test that never touches the P0.4-C3 slug
  // fallback path (the vast majority) doesn't need to know this exists; tests exercising the
  // fallback itself override it explicitly.
  const queryRaw = jest
    .fn<Promise<unknown[]>, unknown[]>()
    .mockResolvedValue([]);
  const prisma = {
    product,
    productPublishedSnapshot,
    $queryRaw: queryRaw,
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
    queryRaw,
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

describe('ProductsService.unpublish', () => {
  it('sets status=draft, same as before', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' }); // assertExists
    product.update.mockResolvedValue({});

    const result = await service.unpublish('p1');

    expect(result).toEqual({ unpublished: true });
    const [updateArgs] = product.update.mock.calls;
    expect(updateArgs[0]).toEqual({
      where: { id: 'p1' },
      data: { status: 'draft' },
    });
  });

  // P0.4-C1 — an unpublish is also a change to what's publicly visible, so AI knowledge must
  // resync to drop this product, same as publish()/restoreSnapshot() already do.
  it('emits content.published with source="products" and the product id, matching the publish() event convention', async () => {
    const { service, product, events } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    product.update.mockResolvedValue({});

    await service.unpublish('p1');

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
    const { service, product, productPublishedSnapshot, queryRaw } =
      buildService();
    product.findFirst.mockResolvedValue({ id: 'p1' });
    productPublishedSnapshot.findFirst.mockResolvedValue(null);
    // Falls through to the P0.4-C3 fallback, which also finds nothing for this id.
    queryRaw.mockResolvedValue([]);

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

// P0.4-C3 — public identity must follow the PUBLISHED SNAPSHOT, not the live draft row: an
// admin can save a new slug on a published product without publishing, and the OLD slug must
// keep resolving to the still-published content until the next Publish. These tests cover the
// two-path resolution added to findPublishedBySlug(): the unchanged fast path (live row match)
// and the new fallback (scans published products' latest snapshots for a frozen slug match).
describe('ProductsService.findPublishedBySlug — slug publish-gate (P0.4-C3)', () => {
  it('(A) normal fast path: an unchanged published slug resolves via the live row, without ever calling the fallback query', async () => {
    const { service, product, productPublishedSnapshot, queryRaw } =
      buildService();
    product.findFirst.mockResolvedValue({ id: 'p1' });
    productPublishedSnapshot.findFirst.mockResolvedValue({
      data: {
        id: 'p1',
        slug: 'copra',
        gallery: [],
        // ISO strings, not Date instances — matches how Postgres jsonb actually round-trips
        // snapshot data, and exercises reviveDates() the same way production data does.
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const result = await service.findPublishedBySlug('copra', 'en');

    expect(result.slug).toBe('copra');
    // (D) fallback must not run at all on the fast path.
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("(B) draft slug change: requesting the OLD (still-published) slug resolves via the fallback, returning the snapshot's content and its own frozen slug", async () => {
    const { service, product, queryRaw } = buildService();
    // Live row's CURRENT slug is "new-slug" — the fast-path lookup for "old-slug" finds nothing.
    product.findFirst.mockResolvedValue(null);
    queryRaw.mockResolvedValue([
      {
        data: {
          id: 'p1',
          slug: 'old-slug',
          name: 'Copra',
          gallery: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ]);

    const result = await service.findPublishedBySlug('old-slug', 'id');

    expect(result.slug).toBe('old-slug');
    // (E) locale is threaded through to the mapper on the fallback path exactly like the fast
    // path — proven indirectly here via a locale-dependent field would require a full
    // translations fixture, so this is asserted directly against the mapper call below instead.
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('(E) locale is passed to the mapper on the fallback path', async () => {
    const { service, product, queryRaw } = buildService();
    product.findFirst.mockResolvedValue(null);
    queryRaw.mockResolvedValue([
      {
        data: {
          id: 'p1',
          slug: 'old-slug',
          name: 'Copra',
          translations: { id: { name: 'Kopra' } },
          gallery: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ]);

    const result = await service.findPublishedBySlug('old-slug', 'id');

    expect(result.name).toBe('Kopra');
  });

  it('(C) a genuinely never-published new slug 404s — the fast path finds nothing live and the fallback finds nothing published either', async () => {
    const { service, product, queryRaw } = buildService();
    product.findFirst.mockResolvedValue(null);
    queryRaw.mockResolvedValue([]);

    await expect(service.findPublishedBySlug('new-slug')).rejects.toThrow(
      ApiException,
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  // Caught live during P0.4-C3 verification: the live row can match `slug` + `status:
  // 'published'` (the fast path's WHERE clause) even when the requested slug was NEVER
  // actually published — this happens exactly when an admin saves a new draft slug on an
  // already-published product without republishing. Before this test existed, the fast path
  // trusted that match and served the OLD snapshot's content at the NEW, not-yet-published URL
  // instead of correctly 404ing. Requesting the new slug must 404, not resolve to stale content.
  it('(C2) a live row matching the requested slug does NOT count as published unless the snapshot itself carries that same slug', async () => {
    const { service, product, productPublishedSnapshot, queryRaw } =
      buildService();
    // Live row's slug was just changed to "new-slug" and the product is still status=published
    // (from an earlier, unrelated publish) — the fast-path WHERE clause matches.
    product.findFirst.mockResolvedValue({ id: 'p1' });
    // But the latest snapshot is still frozen at the OLD slug — nothing has published "new-slug".
    productPublishedSnapshot.findFirst.mockResolvedValue({
      data: {
        id: 'p1',
        slug: 'old-slug',
        gallery: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    // The fallback also correctly finds nothing, since no published snapshot anywhere has
    // "new-slug" as its own data.slug yet.
    queryRaw.mockResolvedValue([]);

    await expect(service.findPublishedBySlug('new-slug')).rejects.toThrow(
      ApiException,
    );
    // Falls through to the fallback rather than trusting the mismatched live-row match.
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('(D) the fallback query runs exactly once when the fast path misses', async () => {
    const { service, product, queryRaw } = buildService();
    product.findFirst.mockResolvedValue(null);
    queryRaw.mockResolvedValue([]);

    await expect(service.findPublishedBySlug('old-slug')).rejects.toThrow(
      ApiException,
    );

    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("(F) the fallback query resolves each product's LATEST snapshot BEFORE filtering by slug, not the other way around", async () => {
    const { service, product, queryRaw } = buildService();
    product.findFirst.mockResolvedValue(null);
    queryRaw.mockResolvedValue([]);

    await expect(service.findPublishedBySlug('old-slug')).rejects.toThrow(
      ApiException,
    );

    const [strings] = queryRaw.mock.calls[0] as [TemplateStringsArray];
    const sql = strings.join('');
    expect(sql).toContain('DISTINCT ON');
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('version DESC');
    expect(sql).toContain("status = 'published'");
    // Caught live during P0.4-C3 verification: filtering by slug BEFORE picking the latest
    // version per product let a slug from an old, superseded version keep matching forever,
    // even after a newer version was published under a different slug — old-slug never 404ed
    // once new-slug went live, contradicting the approved "old-slug → 404 after republish"
    // behavior. The slug filter must be in the OUTER query, applied only to the already-latest
    // row from the inner subquery — asserted here by requiring the inner `DISTINCT ON` subquery
    // (aliased `latest`) to close (`) latest`) BEFORE the slug filter appears in the SQL text.
    const subqueryCloseIndex = sql.indexOf(') latest');
    const slugFilterIndex = sql.indexOf("data->>'slug'");
    expect(subqueryCloseIndex).toBeGreaterThan(-1);
    expect(slugFilterIndex).toBeGreaterThan(subqueryCloseIndex);
  });

  it('(G) an unrelated fallback query error is re-thrown unchanged, not swallowed into a generic ApiException', async () => {
    const { service, product, queryRaw } = buildService();
    product.findFirst.mockResolvedValue(null);
    const dbError = new Error('connection lost');
    queryRaw.mockRejectedValue(dbError);

    await expect(service.findPublishedBySlug('old-slug')).rejects.toBe(dbError);
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

// Phase 5F-P0.3-A — update() previously wrote `translations: dto.translations` as a straight
// column replace; it now merges against the row's existing translations first (fetched via the
// same `assertExists()` call that already ran for every update, just widened by one column).
describe('ProductsService.update — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved in the database', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({
      id: 'p1',
      translations: {
        id: { name: 'Kopra' },
        zh: { name: '椰干' },
      },
    });
    product.update.mockResolvedValue({
      id: 'p1',
      gallery: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.update('p1', {
      translations: { th: { name: 'มะพร้าวแห้ง' } },
    });

    const [call] = product.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({ name: 'มะพร้าวแห้ง' });
    expect(call.data.translations.id).toEqual({ name: 'Kopra' });
    expect(call.data.translations.zh).toEqual({ name: '椰干' });
  });

  it('a single-field edit preserves sibling fields already saved in that same locale', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({
      id: 'p1',
      translations: {
        th: { name: 'ชื่อเดิม', shortDescription: 'คำอธิบายเดิม' },
      },
    });
    product.update.mockResolvedValue({
      id: 'p1',
      gallery: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.update('p1', {
      translations: { th: { name: 'ชื่อใหม่' } },
    });

    const [call] = product.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({
      name: 'ชื่อใหม่',
      shortDescription: 'คำอธิบายเดิม',
    });
  });

  it('updating an SEO translation field preserves the normal content translation for that locale', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({
      id: 'p1',
      translations: {
        vi: { shortDescription: 'Mô tả', metaTitle: 'SEO cũ' },
      },
    });
    product.update.mockResolvedValue({
      id: 'p1',
      gallery: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.update('p1', {
      translations: { vi: { metaTitle: 'SEO mới' } },
    });

    const [call] = product.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.vi).toEqual({
      shortDescription: 'Mô tả',
      metaTitle: 'SEO mới',
    });
  });

  it('omitting translations from the patch leaves the column untouched', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({
      id: 'p1',
      translations: { id: { name: 'Kopra' } },
    });
    product.update.mockResolvedValue({
      id: 'p1',
      gallery: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.update('p1', { name: 'New Name' });

    const [call] = product.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });
});

// P0.3-G — live verification found that deleting a Product with published snapshot history
// threw a raw, unhandled Prisma error (surfaced as an opaque 500) instead of the intended
// PRODUCT_HAS_PUBLISHED_HISTORY (409). Root cause: `P2003` (Prisma's documented FK-violation
// code) is not what Prisma 7's driver-adapter architecture actually throws for this exact
// RESTRICT violation — it throws the generic unmapped code `P2039`, with the real Postgres
// SQLSTATE (`23001` = restrict_violation) preserved in `error.meta`. Mirrors
// articles.service.spec.ts's identical fix/tests exactly (`isArticleDeleteRestrictedByPublishHistory`).
function stubDriverAdapterRestrictError() {
  return {
    code: 'P2039',
    meta: {
      modelName: 'Product',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          originalCode: '23001',
          kind: 'postgres',
          code: '23001',
        },
      },
    },
  };
}

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

  it('converts the real Prisma 7 driver-adapter P2039/23001 error into PRODUCT_HAS_PUBLISHED_HISTORY (409)', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    product.delete.mockRejectedValue(stubDriverAdapterRestrictError());

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

  it('does NOT convert an unrelated P2039 (a different, non-RESTRICT database error)', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    const unrelatedError = {
      code: 'P2039',
      meta: {
        driverAdapterError: { cause: { originalCode: '40001' } }, // serialization_failure, unrelated
      },
    };
    product.delete.mockRejectedValue(unrelatedError);

    await expect(service.remove('p1')).rejects.toBe(unrelatedError);
  });

  it('re-throws any other error unchanged — only the FK-restriction shapes are special-cased', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    const otherError = new Error('connection lost');
    product.delete.mockRejectedValue(otherError);

    await expect(service.remove('p1')).rejects.toBe(otherError);
  });

  it('a Product with no snapshot history still deletes normally', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    product.delete.mockResolvedValue({ id: 'p1' });

    const result = await service.remove('p1');

    expect(result).toEqual({ deleted: true });
    expect(product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
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

describe('ProductsService.update — translation preservation (Phase 5D)', () => {
  it('persists a translations object spanning multiple locales unmodified — editing one locale must not drop the others', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' }); // assertExists
    const translationsWithAllLocales = {
      id: { name: 'Kopra' },
      zh: { name: '椰干' },
      th: { name: 'มะพร้าวแห้ง' },
      vi: { name: 'Cùi dừa khô' }, // the locale being "edited" in this save
    };
    product.update.mockResolvedValue(stubProductRow());

    await service.update('p1', {
      translations: translationsWithAllLocales,
    });

    const [args] = product.update.mock.calls;
    expect(args[0].data.translations).toEqual(translationsWithAllLocales);
    // Explicitly: the other three locales are still present, unchanged, in what gets written —
    // a regression that rebuilt `translations` from only the current locale would fail this.
    expect(args[0].data.translations.id).toEqual({ name: 'Kopra' });
    expect(args[0].data.translations.zh).toEqual({ name: '椰干' });
    expect(args[0].data.translations.th).toEqual({ name: 'มะพร้าวแห้ง' });
  });

  it('does not touch the translations column at all when the caller omits it from the update', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    product.update.mockResolvedValue(stubProductRow());

    await service.update('p1', { name: 'Copra (renamed)' });

    const [args] = product.update.mock.calls;
    // Prisma treats an `undefined` value as "leave this column alone" — asserting it here
    // guards against a future change that starts always writing `translations: dto.translations
    // ?? {}` (which WOULD silently wipe existing translations on any English-only edit).
    expect(args[0].data.translations).toBeUndefined();
  });
});

// Phase 5E-D — Product SEO (metaTitle/metaDescription) reuses the exact same `translations`
// column and `update()` write path already proven safe above; these tests exercise that same
// contract specifically for the two SEO fields, plus the publish/restore/fallback behavior the
// brief calls out by name.
describe('ProductsService.update — SEO translation preservation (Phase 5E-D)', () => {
  it('a TH metaTitle-only edit persists EN(base)/ID/ZH/HI/VI content unchanged', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue(stubProductRow());
    const mergedAfterThEdit = {
      id: { metaTitle: 'Kopra Terbaik' },
      zh: { metaTitle: '最佳椰干' },
      hi: { metaTitle: 'सर्वश्रेष्ठ कोपरा' },
      vi: { metaTitle: 'Cùi dừa khô tốt nhất' },
      th: { metaTitle: 'โคปราที่ดีที่สุด (แก้ไขแล้ว)' },
    };
    product.update.mockResolvedValue(stubProductRow());

    await service.update('p1', { translations: mergedAfterThEdit });

    const args = product.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({
      metaTitle: 'Kopra Terbaik',
    });
    expect(args[0].data.translations.zh).toEqual({ metaTitle: '最佳椰干' });
    expect(args[0].data.translations.hi).toEqual({
      metaTitle: 'सर्वश्रेष्ठ कोपरा',
    });
    expect(args[0].data.translations.vi).toEqual({
      metaTitle: 'Cùi dừa khô tốt nhất',
    });
  });

  it('a VI metaDescription-only edit persists all other locales unchanged', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue(stubProductRow());
    const mergedAfterViEdit = {
      id: { metaDescription: 'Deskripsi SEO kopra.' },
      zh: { metaDescription: '椰干SEO描述。' },
      th: { metaDescription: 'คำอธิบาย SEO โคปรา' },
      hi: { metaDescription: 'कोपरा एसईओ विवरण।' },
      vi: { metaDescription: 'Mô tả SEO cùi dừa khô (đã chỉnh sửa).' },
    };
    product.update.mockResolvedValue(stubProductRow());

    await service.update('p1', { translations: mergedAfterViEdit });

    const args = product.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterViEdit);
    expect(args[0].data.translations.id).toEqual({
      metaDescription: 'Deskripsi SEO kopra.',
    });
    expect(args[0].data.translations.zh).toEqual({
      metaDescription: '椰干SEO描述。',
    });
    expect(args[0].data.translations.th).toEqual({
      metaDescription: 'คำอธิบาย SEO โคปรา',
    });
  });

  it('updating both TH SEO fields preserves other fields already translated in the same TH locale object', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue(stubProductRow());
    // TH already had `name` translated before this SEO edit — the merged payload the admin
    // page sends (per its own setTranslatedField spread-merge) must keep it alongside the two
    // newly-edited SEO fields, not replace the whole TH locale object with just the SEO pair.
    const mergedPayload = {
      th: {
        name: 'มะพร้าวแห้ง (Copra)',
        metaTitle: 'โคปราที่ดีที่สุด',
        metaDescription: 'คำอธิบาย SEO โคปรา',
      },
    };
    product.update.mockResolvedValue(stubProductRow());

    await service.update('p1', { translations: mergedPayload });

    const args = product.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations.th).toEqual({
      name: 'มะพร้าวแห้ง (Copra)',
      metaTitle: 'โคปราที่ดีที่สุด',
      metaDescription: 'คำอธิบาย SEO โคปรา',
    });
  });
});

describe('ProductsService.publish — SEO translation snapshot (Phase 5E-D)', () => {
  it('the published snapshot data includes the translated SEO fields present on the draft row', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    const translationsWithSeo = {
      th: {
        metaTitle: 'โคปราที่ดีที่สุด',
        metaDescription: 'คำอธิบาย SEO โคปรา',
      },
    };
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1' }) // assertExists
      .mockResolvedValueOnce(
        stubProductRow({ translations: translationsWithSeo }),
      ); // buildSnapshotData
    productPublishedSnapshot.findFirst.mockResolvedValue(null);
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date('2026-08-22T00:00:00.000Z'),
    });
    product.update.mockResolvedValue({});

    await service.publish('p1', { id: 'admin-1', name: 'Ari' });

    const [createArgs] = productPublishedSnapshot.create.mock.calls;
    const snapshotData = createArgs[0].data.data as { translations: unknown };
    expect(snapshotData.translations).toEqual(translationsWithSeo);
  });
});

describe('ProductsService.restoreSnapshot — SEO translation restore (Phase 5E-D)', () => {
  it('restoring an older snapshot brings back its translated SEO fields verbatim', async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    const oldSeoTranslations = {
      th: { metaTitle: 'ชื่อ SEO เก่า', metaDescription: 'คำอธิบาย SEO เก่า' },
    };
    const sourceSnapshotData = stubProductRow({
      translations: oldSeoTranslations,
    });
    productPublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-2',
        productId: 'p1',
        data: sourceSnapshotData,
      })
      .mockResolvedValueOnce({ version: 5 });
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-6',
      version: 6,
      publishedAt: new Date('2026-08-22T01:00:00.000Z'),
    });
    product.update.mockResolvedValue({});

    await service.restoreSnapshot('p1', 'snap-2', {
      id: 'admin-1',
      name: 'Ari',
    });

    const [call] = productPublishedSnapshot.create.mock.calls;
    const restoredData = call[0].data.data as { translations: unknown };
    expect(restoredData.translations).toEqual(oldSeoTranslations);
  });
});

describe('toProductDetail — SEO translation fallback (Phase 5E-D)', () => {
  it('falls back to the English metaTitle when the requested locale has no metaTitle translation, while still translating other fields', () => {
    const row = stubProductRow({
      metaTitle: 'Best Copra',
      metaDescription: 'English SEO description.',
      translations: {
        // TH has a `name` translation but no `metaTitle`/`metaDescription` override.
        th: { name: 'มะพร้าวแห้ง (Copra)' },
      },
    });

    const result = toProductDetail(row as never, 'th');

    expect(result.name).toBe('มะพร้าวแห้ง (Copra)');
    expect(result.meta_title).toBe('Best Copra');
    expect(result.meta_description).toBe('English SEO description.');
  });

  it('uses the translated metaTitle when present, and only falls back per-field for metaDescription', () => {
    const row = stubProductRow({
      metaTitle: 'Best Copra',
      metaDescription: 'English SEO description.',
      translations: {
        th: { metaTitle: 'โคปราที่ดีที่สุด' },
      },
    });

    const result = toProductDetail(row as never, 'th');

    expect(result.meta_title).toBe('โคปราที่ดีที่สุด');
    expect(result.meta_description).toBe('English SEO description.');
  });
});

// P2-1 — assertSlugAvailable() is a check-then-act pre-check; these tests prove the actual
// create()/update() write is now also guarded against the TOCTOU race window where two
// concurrent requests both pass the pre-check before either commits.
describe('ProductsService.create/update — slug uniqueness race hardening (P2-1)', () => {
  it('1. the existing pre-check still rejects a duplicate slug on create with 409, before ever reaching product.create', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValueOnce({ id: 'other-product' }); // assertSlugAvailable

    await expect(
      service.create({ slug: 'copra', name: 'Copra' } as never),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(product.create).not.toHaveBeenCalled();
  });

  it('2. the existing pre-check still rejects a duplicate slug on update with 409, before ever reaching product.update', async () => {
    const { service, product } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1', translations: null }) // assertExists
      .mockResolvedValueOnce({ id: 'other-product' }); // assertSlugAvailable

    await expect(service.update('p1', { slug: 'copra' })).rejects.toMatchObject(
      { code: 'CONFLICT' },
    );
    expect(product.update).not.toHaveBeenCalled();
  });

  it('3. a P2002 unique-violation reaching the actual create() call is converted to 409 CONFLICT', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValueOnce(null); // assertSlugAvailable passes
    product.create.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
        meta: { target: ['slug'] },
      }),
    );

    await expect(
      service.create({ slug: 'copra', name: 'Copra' } as never),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Slug "copra" is already in use.',
    });
  });

  it('4. a P2002 unique-violation reaching the actual update() call is converted to 409 CONFLICT', async () => {
    const { service, product } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1', translations: null }) // assertExists
      .mockResolvedValueOnce(null); // assertSlugAvailable passes
    product.update.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
        meta: { target: ['slug'] },
      }),
    );

    await expect(service.update('p1', { slug: 'copra' })).rejects.toMatchObject(
      {
        code: 'CONFLICT',
        message: 'Slug "copra" is already in use.',
      },
    );
  });

  it('5. the Prisma 7 driver-adapter fallback (P2039 + originalCode 23505) reaching create() is converted to 409', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValueOnce(null);
    product.create.mockRejectedValueOnce(
      Object.assign(new Error('unmapped'), {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      }),
    );

    await expect(
      service.create({ slug: 'copra', name: 'Copra' } as never),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Slug "copra" is already in use.',
    });
  });

  it('6. the Prisma 7 driver-adapter fallback (P2039 + originalCode 23505) reaching update() is converted to 409', async () => {
    const { service, product } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1', translations: null })
      .mockResolvedValueOnce(null);
    product.update.mockRejectedValueOnce(
      Object.assign(new Error('unmapped'), {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      }),
    );

    await expect(service.update('p1', { slug: 'copra' })).rejects.toMatchObject(
      {
        code: 'CONFLICT',
        message: 'Slug "copra" is already in use.',
      },
    );
  });

  it('7. an unrelated Prisma error on create is re-thrown unchanged, never converted to CONFLICT', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValueOnce(null);
    const unrelated = Object.assign(new Error('connection lost'), {
      code: 'P1001',
    });
    product.create.mockRejectedValueOnce(unrelated);

    await expect(
      service.create({ slug: 'copra', name: 'Copra' } as never),
    ).rejects.toBe(unrelated);
  });

  it('8. an unrelated Prisma error on update is re-thrown unchanged, never converted to CONFLICT', async () => {
    const { service, product } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1', translations: null })
      .mockResolvedValueOnce(null);
    const unrelated = Object.assign(new Error('connection lost'), {
      code: 'P1001',
    });
    product.update.mockRejectedValueOnce(unrelated);

    await expect(service.update('p1', { slug: 'copra' })).rejects.toBe(
      unrelated,
    );
  });

  it('9. a successful create is completely unaffected by the new try/catch', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValueOnce(null);
    product.create.mockResolvedValueOnce(stubProductRow({ slug: 'copra' }));

    const result = await service.create({
      slug: 'copra',
      name: 'Copra',
    } as never);

    expect(result.slug).toBe('copra');
  });

  it('10. a successful update is completely unaffected by the new try/catch', async () => {
    const { service, product } = buildService();
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1', translations: null })
      .mockResolvedValueOnce(null);
    product.update.mockResolvedValueOnce(
      stubProductRow({ slug: 'copra-updated' }),
    );

    const result = await service.update('p1', {
      slug: 'copra-updated',
    });

    expect(result.slug).toBe('copra-updated');
  });
});
