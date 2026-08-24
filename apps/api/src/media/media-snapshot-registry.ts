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
    // this codebase (e.g. About Company's). Still out of scope — About Company/Homepage/Contact
    // Page DO have their own registry entries below now (P0.4-C2), just not a fix for this
    // specific rich-text-embed limitation.
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
  {
    // P0.4-C2. Homepage/About Company/Contact Page are the public site's exclusive read source
    // for their respective pages (never fall back to draft tables — see each service's
    // `getPublished*()`), so a media file only referenced inside one of these frozen snapshots
    // is genuinely live content right now, not just old history — the exact gap this entry
    // closes. Same blunt full-text substring approach as Products/Articles above, and the same
    // "scan every retained row, not just the latest" semantics: `HomepagePublishedSnapshot` is
    // append-only (one new row per publish/restore, old rows never deleted — mirrors
    // `ProductPublishedSnapshot` exactly, confirmed via `HomepageService.publishHomepage()`/
    // `restoreSnapshot()`/`listSnapshots()`), so every historical version must stay protected,
    // consistent with the existing Products/Articles entries.
    //
    // Neither `HomepagePublishedSnapshot` nor `AboutCompanyPublishedSnapshot` has a `version`
    // column (unlike Product/Article's snapshot tables) — `ROW_NUMBER() OVER (ORDER BY
    // published_at ASC)` computed across every row in the table (not just the matches) assigns
    // a stable, meaningful publish-order number without adding a schema column.
    module: 'Homepage — Version History',
    async findReferences(prisma, mediaId) {
      const rows = await prisma.$queryRaw<
        { version: number; published_at: Date }[]
      >`
        SELECT ranked.version AS version, ranked.published_at AS published_at
        FROM (
          SELECT
            s.published_at AS published_at,
            s.data AS data,
            ROW_NUMBER() OVER (ORDER BY s.published_at ASC)::int AS version
          FROM homepage_published_snapshot s
        ) ranked
        WHERE ranked.data::text LIKE ${'%' + mediaId + '%'}
        ORDER BY ranked.published_at DESC
      `;
      return rows.map((r) => ({
        module: 'Homepage — Version History',
        contentLabel: 'Homepage',
        version: r.version,
        publishedAt: r.published_at,
      }));
    },
  },
  {
    // P0.4-C2. Same rationale/shape as the Homepage entry immediately above — see its comment
    // for why every retained version must be scanned and why `version` is computed rather than
    // stored. `AboutCompanyPublishedSnapshot` is append-only, mirroring
    // `AboutCompanyService.publishAboutCompany()`/`restoreSnapshot()`/`listSnapshots()`.
    module: 'About Company — Version History',
    async findReferences(prisma, mediaId) {
      const rows = await prisma.$queryRaw<
        { version: number; published_at: Date }[]
      >`
        SELECT ranked.version AS version, ranked.published_at AS published_at
        FROM (
          SELECT
            s.published_at AS published_at,
            s.data AS data,
            ROW_NUMBER() OVER (ORDER BY s.published_at ASC)::int AS version
          FROM about_company_published_snapshot s
        ) ranked
        WHERE ranked.data::text LIKE ${'%' + mediaId + '%'}
        ORDER BY ranked.published_at DESC
      `;
      return rows.map((r) => ({
        module: 'About Company — Version History',
        contentLabel: 'About Company',
        version: r.version,
        publishedAt: r.published_at,
      }));
    },
  },
  {
    // P0.4-C2. Contact Page's snapshot is architecturally different from the other four — a
    // SINGLE row updated in place (`ContactPageService.publish()`/`unpublish()` both target the
    // one existing row via `getOrCreateSnapshot()`; there is no `listSnapshots()`/
    // `restoreSnapshot()` for Contact — confirmed absent), and `unpublish()` deliberately never
    // clears `data`, only flips `isPublished`, so the last-published payload stays queryable
    // (and stays the thing `getPublished()` would immediately show again on a future re-publish
    // with no other edits). `data`/`published_at` are nullable (`Json?`/`DateTime?` — no row has
    // ever been published yet) — explicitly excluded rather than relying on `NULL LIKE '%x%'`
    // evaluating to NULL/false. The same `ROW_NUMBER()` shape as Homepage/About Company above is
    // reused for consistency even though there is at most one row today.
    module: 'Contact Page — Version History',
    async findReferences(prisma, mediaId) {
      const rows = await prisma.$queryRaw<
        { version: number; published_at: Date }[]
      >`
        SELECT ranked.version AS version, ranked.published_at AS published_at
        FROM (
          SELECT
            s.published_at AS published_at,
            s.data AS data,
            ROW_NUMBER() OVER (ORDER BY s.published_at ASC)::int AS version
          FROM contact_page_published_snapshot s
          WHERE s.data IS NOT NULL AND s.published_at IS NOT NULL
        ) ranked
        WHERE ranked.data::text LIKE ${'%' + mediaId + '%'}
        ORDER BY ranked.published_at DESC
      `;
      return rows.map((r) => ({
        module: 'Contact Page — Version History',
        contentLabel: 'Contact Page',
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
