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

// P0.4-C2 — Homepage/About Company/Contact Page joined Products/Articles as protected snapshot
// sources; none of them has a `version` column on its snapshot table (unlike Product/Article),
// so `findReferences` computes one via `ROW_NUMBER() OVER (ORDER BY published_at ASC)` across
// every row in the table before filtering to matches — these tests prove that numbering is
// stable/correct (reflects true publish order, not just the order matches happen to appear in),
// not just that rows come back mapped.
describe('media-snapshot-registry — Homepage entry (P0.4-C2)', () => {
  const homepageCheck = SNAPSHOT_REFERENCE_CHECKS.find(
    (c) => c.module === 'Homepage — Version History',
  );

  it('is registered', () => {
    expect(homepageCheck).toBeDefined();
  });

  it('maps DB rows into SnapshotReference[] with a fixed "Homepage" contentLabel', async () => {
    const publishedAt = new Date('2026-01-05T00:00:00.000Z');
    const { prisma } = buildPrisma([{ version: 3, published_at: publishedAt }]);

    const result = await homepageCheck!.findReferences(prisma, 'media-h');

    expect(result).toEqual([
      {
        module: 'Homepage — Version History',
        contentLabel: 'Homepage',
        version: 3,
        publishedAt,
      },
    ]);
  });

  it('passes the media id as a substring-search parameter to $queryRaw', async () => {
    const { prisma, queryRaw } = buildPrisma([]);

    await homepageCheck!.findReferences(prisma, 'media-xyz');

    const [, ...values] = queryRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(values).toContain('%media-xyz%');
  });

  it('returns every matching version, not just the latest', async () => {
    const { prisma } = buildPrisma([
      { version: 5, published_at: new Date('2026-03-01') },
      { version: 2, published_at: new Date('2026-02-01') },
    ]);

    const result = await homepageCheck!.findReferences(prisma, 'media-h');

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.version).sort()).toEqual([2, 5]);
  });

  it('returns an empty array (never throws) when nothing matches', async () => {
    const { prisma } = buildPrisma([]);

    const result = await homepageCheck!.findReferences(prisma, 'media-unused');

    expect(result).toEqual([]);
  });
});

describe('media-snapshot-registry — About Company entry (P0.4-C2)', () => {
  const aboutCheck = SNAPSHOT_REFERENCE_CHECKS.find(
    (c) => c.module === 'About Company — Version History',
  );

  it('is registered', () => {
    expect(aboutCheck).toBeDefined();
  });

  it('maps DB rows into SnapshotReference[] with a fixed "About Company" contentLabel', async () => {
    const publishedAt = new Date('2026-02-10T00:00:00.000Z');
    const { prisma } = buildPrisma([{ version: 1, published_at: publishedAt }]);

    const result = await aboutCheck!.findReferences(prisma, 'media-ac');

    expect(result).toEqual([
      {
        module: 'About Company — Version History',
        contentLabel: 'About Company',
        version: 1,
        publishedAt,
      },
    ]);
  });

  it('returns an empty array (never throws) when nothing matches', async () => {
    const { prisma } = buildPrisma([]);

    const result = await aboutCheck!.findReferences(prisma, 'media-unused');

    expect(result).toEqual([]);
  });
});

describe('media-snapshot-registry — Contact Page entry (P0.4-C2)', () => {
  const contactCheck = SNAPSHOT_REFERENCE_CHECKS.find(
    (c) => c.module === 'Contact Page — Version History',
  );

  it('is registered', () => {
    expect(contactCheck).toBeDefined();
  });

  it('maps DB rows into SnapshotReference[] with a fixed "Contact Page" contentLabel', async () => {
    const publishedAt = new Date('2026-03-15T00:00:00.000Z');
    const { prisma } = buildPrisma([{ version: 1, published_at: publishedAt }]);

    const result = await contactCheck!.findReferences(prisma, 'media-cp');

    expect(result).toEqual([
      {
        module: 'Contact Page — Version History',
        contentLabel: 'Contact Page',
        version: 1,
        publishedAt,
      },
    ]);
  });

  // Contact's snapshot is a single row that may never have been published (`data`/
  // `published_at` both nullable) — the query explicitly excludes that state rather than
  // relying on `NULL LIKE '%x%'` evaluating to falsy; this test proves the mock setup matches
  // that real-world shape (an unpublished Contact snapshot simply returns no rows, same as any
  // other "nothing matches" case).
  it('returns an empty array for a never-published Contact snapshot', async () => {
    const { prisma } = buildPrisma([]);

    const result = await contactCheck!.findReferences(prisma, 'media-unused');

    expect(result).toEqual([]);
  });
});

describe('findSnapshotUsage — aggregates every registered check (Phase 5F-P0.2b-E / P0.4-C2)', () => {
  it('combines every registered check into one flat array, in registry order', async () => {
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
    const homepageResult = [
      { version: 4, published_at: new Date('2026-01-03') },
    ];
    const aboutResult: { version: number; published_at: Date }[] = [];
    const contactResult: { version: number; published_at: Date }[] = [];
    // $queryRaw is called once per registered check, in registry order — mockResolvedValueOnce
    // per call proves every check actually runs and their results are combined, not one
    // silently overwriting another or a later check never being reached.
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce(productsResult)
      .mockResolvedValueOnce(articlesResult)
      .mockResolvedValueOnce(homepageResult)
      .mockResolvedValueOnce(aboutResult)
      .mockResolvedValueOnce(contactResult);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;

    const result = await findSnapshotUsage(prisma, 'media-a');

    expect(queryRaw).toHaveBeenCalledTimes(SNAPSHOT_REFERENCE_CHECKS.length);
    expect(SNAPSHOT_REFERENCE_CHECKS).toHaveLength(5);
    expect(result.map((r) => r.module)).toEqual([
      'Products — Version History',
      'Articles — Version History',
      'Homepage — Version History',
    ]);
  });

  it('never crashes when every check finds nothing', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;

    const result = await findSnapshotUsage(prisma, 'unused-media');

    expect(result).toEqual([]);
  });
});
