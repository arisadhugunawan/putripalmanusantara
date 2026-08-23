// Tests the P0.2b-A backfill script (apps/api/prisma/backfill-article-published-snapshots.ts).
// Lives here rather than next to the script itself because Jest's `rootDir` is `src` (see
// package.json's `jest` block) — the script stays in `prisma/` alongside `seed.ts`, matching
// that file's established location convention, while its test is discovered normally.
import {
  BACKFILL_ACTOR,
  backfillArticlePublishedSnapshots,
  type BackfillPrismaClient,
} from '../../../prisma/backfill-article-published-snapshots';

function buildMockPrisma(overrides: {
  publishedArticles?: Array<{
    id: string;
    publishedAt: Date | null;
    createdAt: Date;
  }>;
  existingSnapshotIds?: Set<string>;
  draftCount?: number;
}): { prisma: BackfillPrismaClient; created: unknown[]; updated: unknown[] } {
  const created: unknown[] = [];
  const updated: unknown[] = [];
  const existingSnapshotIds =
    overrides.existingSnapshotIds ?? new Set<string>();

  const prisma: BackfillPrismaClient = {
    article: {
      findMany: jest.fn().mockResolvedValue(overrides.publishedArticles ?? []),
      update: jest.fn((args: unknown) => {
        updated.push(args);
        return Promise.resolve(args);
      }),
      count: jest.fn().mockResolvedValue(overrides.draftCount ?? 0),
    },
    articlePublishedSnapshot: {
      findFirst: jest.fn((args: unknown) => {
        const { articleId } = (args as { where: { articleId: string } }).where;
        return Promise.resolve(
          existingSnapshotIds.has(articleId)
            ? { id: `existing-${articleId}` }
            : null,
        );
      }),
      create: jest.fn((args: unknown) => {
        created.push(args);
        return Promise.resolve(args);
      }),
    },
    $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
  };

  return { prisma, created, updated };
}

describe('backfillArticlePublishedSnapshots (Phase 5F-P0.2b-A)', () => {
  it('queries only status=published articles — drafts are never even fetched', async () => {
    const { prisma } = buildMockPrisma({ publishedArticles: [] });

    await backfillArticlePublishedSnapshots(prisma);

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'published' } }),
    );
  });

  it('creates exactly one version=1 snapshot per published article with no existing snapshot', async () => {
    const publishedAt = new Date('2026-08-15T05:10:01.399Z');
    const { prisma, created } = buildMockPrisma({
      publishedArticles: [
        {
          id: 'a1',
          publishedAt,
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
        },
      ],
    });

    const result = await backfillArticlePublishedSnapshots(prisma);

    expect(result.snapshotsCreated).toBe(1);
    expect(created).toHaveLength(1);
    const [call] = created as [
      { data: { articleId: string; version: number } },
    ];
    expect(call.data.articleId).toBe('a1');
    expect(call.data.version).toBe(1);
  });

  it('preserves the article\'s original publishedAt — never stamps "now"', async () => {
    const originalPublishedAt = new Date('2026-08-15T05:10:01.399Z');
    const { prisma, created, updated } = buildMockPrisma({
      publishedArticles: [
        {
          id: 'a1',
          publishedAt: originalPublishedAt,
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
        },
      ],
    });

    await backfillArticlePublishedSnapshots(prisma);

    const [snapshotCall] = created as [{ data: { publishedAt: Date } }];
    expect(snapshotCall.data.publishedAt).toBe(originalPublishedAt);
    const [updateCall] = updated as [{ data: { lastPublishedAt: Date } }];
    expect(updateCall.data.lastPublishedAt).toBe(originalPublishedAt);
  });

  it('falls back to createdAt only when publishedAt is somehow null', async () => {
    const createdAt = new Date('2026-08-01T00:00:00.000Z');
    const { prisma, created } = buildMockPrisma({
      publishedArticles: [{ id: 'a1', publishedAt: null, createdAt }],
    });

    await backfillArticlePublishedSnapshots(prisma);

    const [snapshotCall] = created as [{ data: { publishedAt: Date } }];
    expect(snapshotCall.data.publishedAt).toBe(createdAt);
  });

  it('uses the fixed system-backfill actor, never the account running the script', async () => {
    const { prisma, created } = buildMockPrisma({
      publishedArticles: [
        { id: 'a1', publishedAt: new Date(), createdAt: new Date() },
      ],
    });

    await backfillArticlePublishedSnapshots(prisma);

    const [call] = created as [
      { data: { publishedById: string; publishedByName: string } },
    ];
    expect(call.data.publishedById).toBe(BACKFILL_ACTOR.id);
    expect(call.data.publishedByName).toBe(BACKFILL_ACTOR.name);
    expect(BACKFILL_ACTOR.id).toBe('system-backfill');
    expect(BACKFILL_ACTOR.name).toBe('System (backfilled)');
  });

  it('is idempotent — an article that already has a snapshot is skipped, never gets a v2', async () => {
    const { prisma, created } = buildMockPrisma({
      publishedArticles: [
        { id: 'a1', publishedAt: new Date(), createdAt: new Date() },
      ],
      existingSnapshotIds: new Set(['a1']),
    });

    const result = await backfillArticlePublishedSnapshots(prisma);

    expect(result.snapshotsCreated).toBe(0);
    expect(result.skippedAlreadySnapshotted).toBe(1);
    expect(created).toHaveLength(0);
  });

  it('running twice in sequence never produces a duplicate version for the same article', async () => {
    const existingSnapshotIds = new Set<string>();
    const { prisma, created } = buildMockPrisma({
      publishedArticles: [
        { id: 'a1', publishedAt: new Date(), createdAt: new Date() },
      ],
      existingSnapshotIds,
    });
    // Simulate the DB gaining the snapshot the first run created, before the second run starts.
    (prisma.articlePublishedSnapshot.findFirst as jest.Mock).mockImplementation(
      () =>
        Promise.resolve(
          existingSnapshotIds.has('a1') ? { id: 'existing-a1' } : null,
        ),
    );

    const first = await backfillArticlePublishedSnapshots(prisma);
    existingSnapshotIds.add('a1'); // what the real DB would reflect after the first run's create()
    const second = await backfillArticlePublishedSnapshots(prisma);

    expect(first.snapshotsCreated).toBe(1);
    expect(second.snapshotsCreated).toBe(0);
    expect(created).toHaveLength(1); // only ever one version=1, never a second create() call
  });

  it('reports the count of draft articles without creating any snapshot for them', async () => {
    const { prisma, created } = buildMockPrisma({
      publishedArticles: [],
      draftCount: 3,
    });

    const result = await backfillArticlePublishedSnapshots(prisma);

    expect(result.draftArticlesSkipped).toBe(3);
    expect(created).toHaveLength(0);
  });

  it('wraps the snapshot create and the article lastPublishedAt update in one transaction', async () => {
    const { prisma } = buildMockPrisma({
      publishedArticles: [
        { id: 'a1', publishedAt: new Date(), createdAt: new Date() },
      ],
    });

    await backfillArticlePublishedSnapshots(prisma);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const [ops] = (prisma.$transaction as jest.Mock).mock.calls[0] as [
      unknown[],
    ];
    expect(ops).toHaveLength(2);
  });
});
