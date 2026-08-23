// P0.2b-A — one-time (but safely re-runnable) backfill: creates an initial
// `ArticlePublishedSnapshot` (version 1) for every Article that is already `status='published'`
// but has no snapshot yet. This is the historical-data half of the P0.2b snapshot rollout — the
// public read path itself is NOT changed by this script (that's P0.2b-B); it only ensures every
// already-published Article has a v1 to read from once that phase lands, so the cutover to
// snapshot-backed public reads is invisible (no article silently 404s the moment P0.2b-B ships).
//
// Idempotent by construction: an Article that already has ≥1 snapshot is skipped entirely (no
// v2 is ever created here, and `lastPublishedAt` is left untouched on a second run) — running
// this script twice in a row is a no-op the second time. Safe to re-run against a database that
// already received a partial/previous run.
//
// `publishedById`/`publishedByName` are deliberately NOT the admin who happens to run this
// script — the historical publish did not actually happen by that person. Fixed placeholder
// values, per the approved P0.2b-A instructions:
//   publishedById:   "system-backfill"
//   publishedByName: "System (backfilled)"
//
// Pure logic only — no Prisma client creation, no top-level execution, so this module has zero
// side effects on import (safe for both `tsx` and Jest). See
// `run-backfill-article-published-snapshots.ts` for the actual runnable entrypoint, and
// `apps/api/src/modules/articles/backfill-article-published-snapshots.spec.ts` for its tests.

export const BACKFILL_ACTOR = {
  id: 'system-backfill',
  name: 'System (backfilled)',
} as const;

// Exactly `DETAIL_INCLUDE` from articles.service.ts — the snapshot must resolve the same
// relations the live admin/detail read path does, so `toArticleDetail()` can be applied to
// snapshot data at read time (P0.2b-B) with no missing relation. Duplicated here rather than
// imported: this script runs standalone via `tsx`, outside Nest's DI container, and
// `articles.service.ts` is a NestJS-decorated class not meant to be instantiated bare.
export const DETAIL_INCLUDE = {
  coverImage: true,
  ogImage: true,
  categoryRef: true,
  galleryImages: {
    include: { media: true },
    orderBy: { order: 'asc' as const },
  },
} as const;

/** Minimal shape this function actually calls — lets tests pass a plain mock object instead of
 * a real PrismaClient, matching this codebase's established service-spec testing convention
 * (see articles.service.spec.ts's `buildService()`). */
export interface BackfillPrismaClient {
  article: {
    findMany: (
      args: unknown,
    ) => Promise<
      Array<{ id: string; publishedAt: Date | null; createdAt: Date }>
    >;
    update: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  articlePublishedSnapshot: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  };
  $transaction: (ops: unknown[]) => Promise<unknown[]>;
}

export interface BackfillResult {
  publishedArticlesFound: number;
  snapshotsCreated: number;
  skippedAlreadySnapshotted: number;
  draftArticlesSkipped: number;
}

export async function backfillArticlePublishedSnapshots(
  prisma: BackfillPrismaClient,
): Promise<BackfillResult> {
  const publishedArticles = await prisma.article.findMany({
    where: { status: 'published' },
    include: DETAIL_INCLUDE,
  });

  let created = 0;
  let skippedAlreadySnapshotted = 0;

  for (const article of publishedArticles) {
    const existingSnapshot = await prisma.articlePublishedSnapshot.findFirst({
      where: { articleId: article.id },
      select: { id: true },
    });
    if (existingSnapshot) {
      skippedAlreadySnapshotted += 1;
      continue;
    }

    // Preserves the article's original publish date rather than "now" — this is backfilling
    // history, not creating a new publish event.
    const publishedAt = article.publishedAt ?? article.createdAt;

    await prisma.$transaction([
      prisma.articlePublishedSnapshot.create({
        data: {
          articleId: article.id,
          version: 1,
          data: article as never,
          publishedById: BACKFILL_ACTOR.id,
          publishedByName: BACKFILL_ACTOR.name,
          publishedAt,
        },
      }),
      prisma.article.update({
        where: { id: article.id },
        data: { lastPublishedAt: publishedAt },
      }),
    ]);
    created += 1;
  }

  const draftCount = await prisma.article.count({ where: { status: 'draft' } });

  return {
    publishedArticlesFound: publishedArticles.length,
    snapshotsCreated: created,
    skippedAlreadySnapshotted,
    draftArticlesSkipped: draftCount,
  };
}
