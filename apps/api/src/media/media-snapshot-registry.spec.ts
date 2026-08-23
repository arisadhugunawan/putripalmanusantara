import {
  SNAPSHOT_REFERENCE_CHECKS,
  findSnapshotUsage,
} from './media-snapshot-registry';
import type { PrismaService } from '../prisma/prisma.service';

/** `$queryRaw` is a tagged-template function — invoking it as
 * `` prisma.$queryRaw<T>`SELECT ...` `` calls this mock with (strings, ...values), exactly like
 * the real Prisma client does. Each test controls what row(s) it resolves to; the SQL text
 * itself is not re-implemented here (that's Postgres's job) — these tests prove the registry's
 * JS-side query construction, mapping, and aggregation, matching the same trust boundary
 * `media.service.spec.ts` already uses (it entirely module-mocks `findSnapshotUsage`, never
 * exercising the real query — this file is what actually exercises it). Real substring-search
 * SQL semantics (multi-version, restore, unpublish, draft-isolation) are proven live — see the
 * P0.2b-E report's Live Verification section.
 */
function buildPrisma(rows: unknown[]) {
  const queryRaw = jest.fn().mockResolvedValue(rows);
  return {
    prisma: { $queryRaw: queryRaw } as unknown as PrismaService,
    queryRaw,
  };
}

describe('media-snapshot-registry — Articles entry (Phase 5F-P0.2b-E)', () => {
  const articlesCheck = SNAPSHOT_REFERENCE_CHECKS.find(
    (c) => c.module === 'Articles — Version History',
  );

  it('is registered', () => {
    expect(articlesCheck).toBeDefined();
  });

  it('maps DB rows into SnapshotReference[] with the article title as contentLabel', async () => {
    const publishedAt = new Date('2026-01-05T00:00:00.000Z');
    const { prisma } = buildPrisma([
      { title: 'Copra Export Update', version: 2, published_at: publishedAt },
    ]);

    const result = await articlesCheck!.findReferences(prisma, 'media-a');

    expect(result).toEqual([
      {
        module: 'Articles — Version History',
        contentLabel: 'Copra Export Update',
        version: 2,
        publishedAt,
      },
    ]);
  });

  it('passes the media id as a substring-search parameter to $queryRaw', async () => {
    const { prisma, queryRaw } = buildPrisma([]);

    await articlesCheck!.findReferences(prisma, 'media-xyz');

    const [, ...values] = queryRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(values).toContain('%media-xyz%');
  });

  it('returns every matching version, not just the latest (multiple published versions)', async () => {
    const { prisma } = buildPrisma([
      { title: 'Article', version: 3, published_at: new Date('2026-03-01') },
      { title: 'Article', version: 2, published_at: new Date('2026-02-01') },
      { title: 'Article', version: 1, published_at: new Date('2026-01-01') },
    ]);

    const result = await articlesCheck!.findReferences(prisma, 'media-a');

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.version).sort()).toEqual([1, 2, 3]);
  });

  it('returns an empty array (never throws) when nothing matches', async () => {
    const { prisma } = buildPrisma([]);

    const result = await articlesCheck!.findReferences(prisma, 'media-unused');

    expect(result).toEqual([]);
  });

  it('handles multiple different Articles referencing the same media safely', async () => {
    const { prisma } = buildPrisma([
      {
        title: 'Article One',
        version: 1,
        published_at: new Date('2026-01-01'),
      },
      {
        title: 'Article Two',
        version: 1,
        published_at: new Date('2026-01-02'),
      },
    ]);

    const result = await articlesCheck!.findReferences(prisma, 'shared-media');

    expect(result.map((r) => r.contentLabel).sort()).toEqual([
      'Article One',
      'Article Two',
    ]);
  });
});

describe('findSnapshotUsage — aggregates every registered check (Phase 5F-P0.2b-E)', () => {
  it('combines Products and Articles results into one flat array', async () => {
    const productsResult = [
      {
        title: 'Copra',
        version: 1,
        published_at: new Date('2026-01-01'),
        name: 'Copra',
      },
    ];
    const articlesResult = [
      { title: 'News Piece', version: 1, published_at: new Date('2026-01-02') },
    ];
    // $queryRaw is called once per registered check, in registry order (Products, then
    // Articles) — mockResolvedValueOnce per call proves both checks actually run and their
    // results are combined, not one silently overwriting the other.
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce(productsResult)
      .mockResolvedValueOnce(articlesResult);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;

    const result = await findSnapshotUsage(prisma, 'media-a');

    expect(queryRaw).toHaveBeenCalledTimes(SNAPSHOT_REFERENCE_CHECKS.length);
    expect(result.map((r) => r.module)).toEqual([
      'Products — Version History',
      'Articles — Version History',
    ]);
  });

  it('never crashes when every check finds nothing', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;

    const result = await findSnapshotUsage(prisma, 'unused-media');

    expect(result).toEqual([]);
  });
});
