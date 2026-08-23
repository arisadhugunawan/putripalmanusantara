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
 * content type (e.g. if Gallery ever gains its own `*PublishedSnapshot`) means appending one
 * entry here, not touching `MediaService`'s deletion logic at all.
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
  {
    // Phase 5F-P0.2b-E. Same blunt full-text approach as Products above — an Article snapshot's
    // `data` blob holds a media id at `coverImage.id`, `ogImage.id`, and
    // `galleryImages[].media.id` (the only media-bearing fields `DETAIL_INCLUDE` resolves), all
    // covered by this substring search. Scanning every version (not just the latest) and never
    // the live Article row is inherent to querying `article_published_snapshots` directly:
    // unpublish leaves every row untouched (still found), a restore's new version still
    // contains the same id string as the version it copied (still found), and a draft-only
    // media change is invisible here because the live `articles` table is never queried.
    //
    // KNOWN GAP, pre-existing and NOT specific to Articles (see the P0.2b-E report): inline
    // images inserted into rich-text `content` via the editor's image button embed the media's
    // `file_url` in the `<img src>`, never its `id` — this substring search can't find those.
    // Reproducing this identical limitation (rather than inventing a URL-based second parser)
    // matches the brief's "do not implement a second parser unless the existing architecture
    // requires it"; the same gap already exists for every other rich-text-with-images field in
    // this codebase (e.g. About Company's), and About Company/Homepage don't even have a
    // registry entry yet at all — both out of scope here.
    module: 'Articles — Version History',
    async findReferences(prisma, mediaId) {
      const rows = await prisma.$queryRaw<
        { title: string; version: number; published_at: Date }[]
      >`
        SELECT a.title AS title, s.version AS version, s.published_at AS published_at
        FROM article_published_snapshots s
        JOIN articles a ON a.id = s.article_id
        WHERE s.data::text LIKE ${'%' + mediaId + '%'}
        ORDER BY s.published_at DESC
      `;
      return rows.map((r) => ({
        module: 'Articles — Version History',
        contentLabel: r.title,
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
