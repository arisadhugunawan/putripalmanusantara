import type { PrismaService } from '../prisma/prisma.service';

export interface SnapshotReference {
  module: string;
  contentLabel: string;
  version: number;
  publishedAt: Date;
}

interface SnapshotReferenceCheck {
  module: string;
  /** Search the frozen JSON blob's TEXT representation for the media id anywhere inside it —
   * deliberately a blunt full-text match rather than knowing every nested path (a snapshot's
   * `data` can hold a media reference at `coverImage.id`, `gallery[].media.id`,
   * `shapes[].media.id`, `packagingAndApps[].media.id`, ...). Correct and simple: cuids are
   * unique random strings, so a substring match can't false-positive against an unrelated id. */
  findReferences(
    prisma: PrismaService,
    mediaId: string,
  ): Promise<SnapshotReference[]>;
}

/**
 * Registry of every append-only snapshot table that can hold a frozen reference to a `Media`
 * row — checked before permanently deleting media, since the existing live-relation FK guard
 * (`P2003` on `prisma.media.delete()`) cannot see into a JSON blob. Adding a future versioned
 * content type (e.g. if Articles or Gallery ever gain their own `*PublishedSnapshot`) means
 * appending one entry here, not touching `MediaService`'s deletion logic at all.
 */
export const SNAPSHOT_REFERENCE_CHECKS: SnapshotReferenceCheck[] = [
  {
    module: 'Products — Version History',
    async findReferences(prisma, mediaId) {
      const rows = await prisma.$queryRaw<
        { name: string; version: number; published_at: Date }[]
      >`
        SELECT p.name AS name, s.version AS version, s.published_at AS published_at
        FROM product_published_snapshots s
        JOIN products p ON p.id = s.product_id
        WHERE s.data::text LIKE ${'%' + mediaId + '%'}
        ORDER BY s.published_at DESC
      `;
      return rows.map((r) => ({
        module: 'Products — Version History',
        contentLabel: r.name,
        version: r.version,
        publishedAt: r.published_at,
      }));
    },
  },
];

export async function findSnapshotUsage(
  prisma: PrismaService,
  mediaId: string,
): Promise<SnapshotReference[]> {
  const results = await Promise.all(
    SNAPSHOT_REFERENCE_CHECKS.map((check) =>
      check.findReferences(prisma, mediaId),
    ),
  );
  return results.flat();
}
