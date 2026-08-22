/**
 * One-off migration backfill for Products Draft/Publish/Version-History (Post-Launch Phase 2).
 *
 * Before this phase, the public site and AI Assistant read Products straight from the live,
 * always-mutable row filtered by `status = 'published'` — there was no snapshot concept at all.
 * After this phase, both read the latest `ProductPublishedSnapshot` instead, and a product with
 * `status = 'published'` but zero snapshots is now treated as unpublished (404 publicly, absent
 * from AI knowledge) — exactly the same as it would look to a brand-new admin who never clicked
 * Publish. Any product that was already `status = 'published'` before this migration therefore
 * needs an initial version-1 snapshot created from its current data, or it silently disappears
 * from the public site the moment this deploy goes live. THIS SCRIPT IS THAT ONE-TIME STEP.
 *
 * Safe to re-run: only touches products with `status = 'published'` AND zero existing
 * snapshots, so running it twice (or after some products have already been manually
 * re-published) is a no-op for anything it already handled.
 *
 * Run once, immediately after deploying the Phase 2 migration, in every environment that has
 * pre-existing "published" products: `npx tsx scripts/backfill-product-snapshots.ts`
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DETAIL_INCLUDE = {
  coverImage: true,
  gallery: { include: { media: true } },
  shapes: { include: { media: true }, orderBy: { order: 'asc' as const } },
  specifications: true,
  packagingAndApps: {
    include: { media: true },
    orderBy: { order: 'asc' as const },
  },
  downloads: true,
};

async function main() {
  const candidates = await prisma.product.findMany({
    where: { status: 'published' },
    select: { id: true, slug: true },
  });

  let backfilled = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const existing = await prisma.productPublishedSnapshot.findFirst({
      where: { productId: candidate.id },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const data = await prisma.product.findUnique({
      where: { id: candidate.id },
      include: DETAIL_INCLUDE,
    });
    if (!data) continue;

    await prisma.$transaction([
      prisma.productPublishedSnapshot.create({
        data: {
          productId: candidate.id,
          version: 1,
          data: data as never,
          publishedById: 'system',
          publishedByName: 'System (migration backfill)',
          publishedAt: data.updatedAt,
        },
      }),
      // Also re-asserts `updatedAt` to the same instant — any plain `.update()` call bumps
      // `@updatedAt` to "now" regardless of which fields changed, which would otherwise make
      // `updatedAt > lastPublishedAt` immediately after this backfill and falsely show "Draft
      // changes: Yes" for a product nobody has actually touched since.
      prisma.product.update({
        where: { id: candidate.id },
        data: { lastPublishedAt: data.updatedAt, updatedAt: data.updatedAt },
      }),
    ]);

    backfilled++;
    console.log(`Backfilled v1 snapshot for "${candidate.slug}".`);
  }

  console.log(
    `Done. Backfilled: ${backfilled}. Already had a snapshot (skipped): ${skipped}.`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
