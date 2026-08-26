import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import {
  CONTENT_PUBLISHED_EVENT,
  type ContentPublishedEvent,
} from '../../common/events/content-published.event';
import { mergeTranslations } from '../../common/utils/i18n.util';
import {
  sanitizeRichText,
  sanitizeTranslationsRichText,
} from '../../common/utils/sanitize-rich-text.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AiTranslationService,
  buildGenerateTranslationsResponse,
  computeTranslationStatus,
} from '../ai/ai-translation.service';
import { toArticleCategory } from './article-category.mapper';
import { toArticleDetail, toArticleSummary } from './article.mapper';
import type {
  AddArticleGalleryItemDto,
  ArticleQueryDto,
  CreateArticleCategoryDto,
  CreateArticleDto,
  UpdateArticleCategoryDto,
  UpdateArticleDto,
  UpdateArticleGalleryItemDto,
} from './dto/article.dto';
import type { AdminArticleQueryDto } from './dto/admin-article-query.dto';
import type {
  InstagramDuplicateResult,
  InstagramImportResult,
} from '@ppn/shared-types';

const SORT_FIELD_MAP: Record<string, string> = {
  published_at: 'publishedAt',
  created_at: 'createdAt',
  title: 'title',
};

/** Bounds the slug-conflict retry loop in `create()`/`update()` (P2-1) — protects against an
 * infinite loop if something is systematically wrong (e.g. `resolveSlug()` itself broken), while
 * comfortably covering realistic concurrent-request bursts against the same title. */
const MAX_SLUG_RETRY_ATTEMPTS = 5;

/** Bounds the snapshot-version retry loop in publish()/restoreSnapshot() (P2-3) — protects
 * against retrying forever if something is systematically wrong, while comfortably covering
 * realistic concurrent-publish bursts against the same article. Mirrors
 * `ProductsService`'s identical constant. */
const MAX_SNAPSHOT_VERSION_RETRY_ATTEMPTS = 3;

/** The ten categories the brief lists — seeded once, then fully Admin-owned (add/rename/
 * reorder/deactivate/delete freely from there on). */
const DEFAULT_ARTICLE_CATEGORIES = [
  'Industry Insight',
  'Coconut Export',
  'Agriculture',
  'Supply Chain',
  'Global Trade',
  'Company Update',
  'Product Update',
  'Market Insight',
  'News',
  'Other',
];

const DETAIL_INCLUDE = {
  coverImage: true,
  ogImage: true,
  categoryRef: true,
  galleryImages: {
    include: { media: true },
    orderBy: { order: 'asc' as const },
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

/** Matches /p/, /reel/, /tv/ post URLs (brief §05) — captures the shortcode, which is what
 * actually identifies a post (URLs otherwise differ by trailing slash, query string, or
 * www./m. subdomain). */
const INSTAGRAM_POST_URL_PATTERN =
  /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i;

function extractInstagramShortcode(url: string): string | null {
  const match = url.trim().match(INSTAGRAM_POST_URL_PATTERN);
  return match ? match[3] : null;
}

/** Admin forms post `""` for a cleared optional field; store that as SQL NULL — same
 * convention as about-company.service.ts's emptyToNull(). */
function emptyToNull(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() === '' ? null : value;
}

/** Actor recorded on a snapshot — deliberately just the two display fields, not a full
 * `CurrentAdminPayload`, since that's all `ArticlePublishedSnapshot` denormalizes (see its
 * schema doc comment for why: no FK to `Admin`, history must outlive the account). Same shape
 * as `ProductsService`'s identical `PublishActor`. */
interface PublishActor {
  id: string;
  name: string;
}

/** Snapshot history is capped at the same depth as Product's (`take: 20`) — old rows are never
 * deleted, just no longer listed. */
const SNAPSHOT_LIST_LIMIT = 20;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** JSON round-trips through the `Json` column turn every Date into a plain ISO string — this
 * reconstructs real Date objects so `toArticleSummary`/`toArticleDetail` (which call
 * `.toISOString()` on several fields) work unmodified against snapshot data. Same helper as
 * products.service.ts/about-company.service.ts/homepage.service.ts, duplicated per-service by
 * this codebase's documented convention rather than extracted into a shared util. */
function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    const items = value as unknown[];
    return items.map((v) => reviveDates(v)) as never;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] =
        typeof val === 'string' && ISO_DATE_RE.test(val)
          ? new Date(val)
          : reviveDates(val);
    }
    return out as T;
  }
  return value;
}

type SnapshotRow = Record<string, unknown> & { id: string };

/** `publishedAt` on the frozen snapshot mirrors the live row's own createdAt-fallback
 * convention (see `toArticleSummary`'s `article.publishedAt ?? article.createdAt`) — kept as
 * one helper so `findLatest`/`findRelated`'s recency sort agrees with what the mapper displays. */
function snapshotPublishedAt(row: SnapshotRow): Date {
  return (row.publishedAt as Date | null) ?? (row.createdAt as Date);
}

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly translationService: AiTranslationService,
  ) {}

  /** The article's own master-content fields `translate()` resolves (see article.mapper.ts) —
   * mirrors `ProductsService.TRANSLATABLE_PRODUCT_FIELDS` exactly, just for Article's field set. */
  private static readonly TRANSLATABLE_ARTICLE_FIELDS = [
    'title',
    'excerpt',
    'content',
    'metaTitle',
    'metaDescription',
    'quoteText',
  ] as const;

  private static readonly TRANSLATABLE_CATEGORY_FIELDS = [
    'name',
    'description',
  ] as const;

  // ── Public — reads the latest PUBLISHED SNAPSHOT, never the live draft row ──────────────
  //
  // `status: 'published'` on the live `Article` row is only ever the visibility gate (flipped
  // by publish()/unpublish(), never by ordinary update()); every publicly-shown field comes
  // from that article's own latest `ArticlePublishedSnapshot.data`, frozen at publish time. A
  // draft edit is therefore invisible publicly until the next Publish — same single, simple
  // boundary rule as `ProductsService`, with no "low-risk field reads live" exceptions.

  private async latestSnapshotsByArticle(
    articleIds: string[],
  ): Promise<Map<string, SnapshotRow>> {
    if (articleIds.length === 0) return new Map();
    const rows = await this.prisma.articlePublishedSnapshot.findMany({
      where: { articleId: { in: articleIds } },
      orderBy: [{ articleId: 'asc' }, { version: 'desc' }],
      distinct: ['articleId'],
    });
    return new Map(
      rows.map((row) => [
        row.articleId,
        reviveDates(row.data as Record<string, unknown>) as SnapshotRow,
      ]),
    );
  }

  /** Every published Article that actually has a snapshot to show — the shared content source
   * for `findPublished`/`findLatest`/`findRelated`. Exactly 2 queries regardless of how many
   * Articles exist (eligible-id lookup + one bulk snapshot fetch), matching
   * `ProductsService.publishedSummaries()`'s N+1-free pattern. A published Article with zero
   * snapshots (only reachable by bypassing `publish()`, never through the admin UI) is silently
   * excluded, never falls back to its live row. */
  private async publishedSnapshotRows(): Promise<SnapshotRow[]> {
    const published = await this.prisma.article.findMany({
      where: { status: 'published' },
      select: { id: true },
    });
    const latest = await this.latestSnapshotsByArticle(
      published.map((a) => a.id),
    );
    return [...latest.values()];
  }

  async findPublished(query: ArticleQueryDto) {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'publishedAt';
    const q = query.q?.trim();

    let rows = await this.publishedSnapshotRows();

    if (query.category_id) {
      rows = rows.filter((r) => r.categoryId === query.category_id);
    }
    if (query.featured !== undefined) {
      rows = rows.filter((r) => Boolean(r.featured) === query.featured);
    }
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          (typeof r.title === 'string' &&
            r.title.toLowerCase().includes(needle)) ||
          (typeof r.excerpt === 'string' &&
            r.excerpt.toLowerCase().includes(needle)) ||
          (Array.isArray(r.tags) && (r.tags as string[]).includes(q)),
      );
    }

    rows.sort((a, b) => {
      const av =
        orderField === 'title'
          ? typeof a.title === 'string'
            ? a.title
            : ''
          : orderField === 'createdAt'
            ? (a.createdAt as Date).getTime()
            : snapshotPublishedAt(a).getTime();
      const bv =
        orderField === 'title'
          ? typeof b.title === 'string'
            ? b.title
            : ''
          : orderField === 'createdAt'
            ? (b.createdAt as Date).getTime()
            : snapshotPublishedAt(b).getTime();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return direction === 'desc' ? -cmp : cmp;
    });

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    const page = rows.slice(start, start + query.limit);

    return {
      items: page.map((data) => toArticleSummary(data as never, query.locale)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findLatest(locale?: string) {
    const rows = await this.publishedSnapshotRows();
    rows.sort(
      (a, b) =>
        snapshotPublishedAt(b).getTime() - snapshotPublishedAt(a).getTime(),
    );
    return rows
      .slice(0, 3)
      .map((data) => toArticleSummary(data as never, locale));
  }

  /** Category chips on the public listing page only offer categories that actually have
   * something to show, and never the ones an Admin has deactivated. `ArticleCategory` is shared
   * taxonomy, not per-Article content — deliberately NOT snapshotted (P0.2b-B §7) — so this
   * stays a live read exactly as before. */
  async findPublicCategories() {
    const categories = await this.prisma.articleCategory.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    return categories.map((c) => toArticleCategory(c));
  }

  async findPublishedBySlug(slug: string, locale?: string) {
    // Fast path — unchanged from before P0.4-C3, indexed on `Article.slug`, covers the
    // overwhelming majority of requests (no pending unpublished slug edit on this article).
    const article = await this.prisma.article.findFirst({
      where: { slug, status: 'published' },
      select: { id: true },
    });
    if (article) {
      const snapshot = await this.prisma.articlePublishedSnapshot.findFirst({
        where: { articleId: article.id },
        orderBy: { version: 'desc' },
      });
      // The live row matching `slug` is necessary but not sufficient — an admin can save a NEW
      // draft slug on an already-published article (live row now matches the new slug) without
      // publishing, in which case the latest snapshot still carries the OLD slug. Trusting the
      // live-row match alone here would serve stale content at a URL nothing has actually
      // published yet (confirmed live during P0.4-C3 verification of the identical Product
      // case — this exact scenario returned 200 with the old snapshot instead of 404 before
      // this check was added). Requiring the snapshot's own frozen slug to also equal the
      // request keeps the fast path fast for the normal case while correctly falling through to
      // NOT_FOUND for a not-yet-published new slug.
      const snapshotData = snapshot?.data as { slug?: string } | undefined;
      if (snapshot && snapshotData?.slug === slug) {
        return toArticleDetail(reviveDates(snapshot.data as never), locale);
      }
      // Either no snapshot exists yet, or the snapshot's slug has since diverged from the live
      // row's. Falls through to the fallback path below. Same rule (and same reason) as
      // ProductsService's equivalent.
    }

    // Fallback (P0.4-C3) — only reached when the live row's CURRENT slug doesn't match the
    // request. Public identity must follow the PUBLISHED SNAPSHOT, not the live draft row —
    // same rationale as ProductsService.findPublishedBySlug()'s identical fallback: the OLD
    // slug must keep resolving to the still-published content until the next Publish.
    //
    // The inner query resolves each published article's LATEST snapshot ONLY (`DISTINCT ON` +
    // `ORDER BY version DESC`) BEFORE any slug filtering — the slug check happens in the outer
    // query, against that single latest row. Filtering by slug first (checked live during
    // P0.4-C3 verification of the identical Product case, then corrected) would let a slug from
    // any OLD, superseded version keep matching forever, even after a newer version was
    // published under a different slug — exactly the "old-slug should 404 once new-slug is
    // published" case this must NOT do. Deliberately not indexed — only ever hit in the narrow
    // post-edit, pre-republish window, never on the normal hot path above.
    const fallback = await this.prisma.$queryRaw<{ data: unknown }[]>`
      SELECT latest.data AS data
      FROM (
        SELECT DISTINCT ON (s.article_id) s.data AS data
        FROM article_published_snapshots s
        JOIN articles a ON a.id = s.article_id
        WHERE a.status = 'published'
        ORDER BY s.article_id, s.version DESC
      ) latest
      WHERE latest.data->>'slug' = ${slug}
    `;
    if (fallback.length > 0) {
      return toArticleDetail(reviveDates(fallback[0].data as never), locale);
    }

    throw new ApiException('NOT_FOUND', 'Article not found.', 404);
  }

  /** Related Insights — matched by category first, since Article has no tag-similarity
   * scoring; falls back to latest published articles when the article has no category or too
   * few matches, so the block is never empty just because a category is niche. The source
   * Article's own category is read from ITS latest snapshot too (not the live row), so a draft
   * category change doesn't retroactively reshuffle what counts as "related" before that change
   * is published. Reuses `publishedSnapshotRows()` — 3 queries total (source snapshot + the
   * shared 2-query bulk fetch), fixed regardless of how many Articles exist. */
  async findRelated(articleId: string, locale?: string, take = 3) {
    const sourceSnapshot = await this.prisma.articlePublishedSnapshot.findFirst(
      {
        where: { articleId },
        orderBy: { version: 'desc' },
        select: { data: true },
      },
    );
    if (!sourceSnapshot) return [];
    const sourceCategoryId = (sourceSnapshot.data as Record<string, unknown>)
      .categoryId as string | null;

    const rows = (await this.publishedSnapshotRows())
      .filter((r) => r.id !== articleId)
      .sort(
        (a, b) =>
          snapshotPublishedAt(b).getTime() - snapshotPublishedAt(a).getTime(),
      );

    const byCategory = sourceCategoryId
      ? rows.filter((r) => r.categoryId === sourceCategoryId)
      : [];
    const selected = byCategory.slice(0, take);

    if (selected.length < take) {
      const selectedIds = new Set(selected.map((r) => r.id));
      const fallback = rows
        .filter((r) => !selectedIds.has(r.id))
        .slice(0, take - selected.length);
      selected.push(...fallback);
    }

    return selected.map((data) => toArticleSummary(data as never, locale));
  }

  // ── Admin ───────────────────────────────────────────────────────────
  async findAllForAdmin() {
    const items = await this.prisma.article.findMany({
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((article) => toArticleDetail(article));
  }

  /** Backs the admin Articles list page (Phase 5C) — paginated, searchable, filterable. Only
   * reached when the caller explicitly passes `page` (see `AdminArticlesController.findAll()`);
   * the Admin Dashboard and the article-preview-by-id lookup still get the full unpaginated
   * list via `findAllForAdmin()`. Replicates the old client-side tabs/search/sort exactly, just
   * moved server-side — see `AdminArticleQueryDto` for the field-by-field mapping. */
  async findAllForAdminPaginated(query: AdminArticleQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit;
    const q = query.q?.trim();
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.featured !== undefined
        ? { featured: query.featured === 'true' }
        : {}),
      ...(query.category ? { categoryRef: { slug: query.category } } : {}),
      ...(query.content_type === 'website'
        ? { contentSource: { not: 'instagram' as const } }
        : {}),
      ...(query.content_type === 'instagram'
        ? { contentSource: { not: 'website' as const } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { excerpt: { contains: q, mode: 'insensitive' as const } },
              {
                instagramCaption: {
                  contains: q,
                  mode: 'insensitive' as const,
                },
              },
              {
                categoryRef: {
                  name: { contains: q, mode: 'insensitive' as const },
                },
              },
              { tags: { has: q } },
            ],
          }
        : {}),
    };
    const orderBy =
      query.sort === '-featured'
        ? [{ featured: 'desc' as const }, { publishedAt: 'desc' as const }]
        : query.sort === 'published_at'
          ? { publishedAt: 'asc' as const }
          : { publishedAt: 'desc' as const };
    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);
    return {
      items: items.map((article) => toArticleDetail(article)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByIdForAdmin(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!article) {
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    }
    return toArticleDetail(article);
  }

  async create(dto: CreateArticleDto) {
    if (dto.instagram_url?.trim()) {
      const duplicate = await this.findInstagramDuplicate(dto.instagram_url);
      if (duplicate) {
        throw new ApiException(
          'INSTAGRAM_URL_DUPLICATE',
          'This Instagram post has already been added.',
          409,
          {
            existing_article_id: duplicate.id,
            existing_article_title: duplicate.title,
          },
        );
      }
    }
    const baseSlug = dto.slug || dto.title;
    let slug = await this.resolveSlug(baseSlug);
    for (let attempt = 0; ; attempt++) {
      try {
        const article = await this.prisma.article.create({
          data: {
            slug,
            title: dto.title,
            excerpt: dto.excerpt,
            content: sanitizeRichText(dto.content),
            coverImageId: dto.cover_image_id,
            categoryId: emptyToNull(dto.category_id),
            tags: dto.tags ?? [],
            author: dto.author,
            featured: dto.featured ?? false,
            contentSource: dto.content_source ?? 'website',
            instagramCaption: dto.instagram_caption,
            instagramUrl: emptyToNull(dto.instagram_url),
            instagramPostId: dto.instagram_url
              ? (extractInstagramShortcode(dto.instagram_url) ?? undefined)
              : undefined,
            instagramImportedAt: dto.instagram_imported_at
              ? new Date(dto.instagram_imported_at)
              : undefined,
            instagramDate: dto.instagram_date
              ? new Date(dto.instagram_date)
              : undefined,
            instagramUsername: emptyToNull(dto.instagram_username),
            metaTitle: dto.meta_title,
            metaDescription: dto.meta_description,
            canonicalUrl: emptyToNull(dto.canonical_url),
            focusKeyword: dto.focus_keyword,
            ogImageId: emptyToNull(dto.og_image_id),
            keyTakeaways: dto.key_takeaways ?? [],
            quoteText: emptyToNull(dto.quote_text),
            quoteAuthor: emptyToNull(dto.quote_author),
            statistics: dto.statistics as never,
            readingTimeMinutes: dto.reading_time_minutes,
            // Every article is born a draft, full stop — publishing is a deliberate, separately
            // role-gated act (`publish()` below), never a side effect of create/update. `dto.status`
            // is intentionally ignored here so a caller can never skip that gate by creating an
            // article pre-published (Phase 5F-P0.2).
            status: 'draft',
            publishedAt: null,
            translations: sanitizeTranslationsRichText(dto.translations, [
              'content',
            ]) as never,
          },
          include: DETAIL_INCLUDE,
        });
        return toArticleDetail(article);
      } catch (error) {
        // P2-1 — closes the TOCTOU race between `resolveSlug()`'s read-loop above and this
        // write: if another request claimed `slug` in between, re-resolve (a fresh DB read,
        // so it naturally skips whatever is now taken) and retry, preserving the existing
        // "always succeeds with the next available suffix" behavior rather than surfacing a
        // new rejection to the caller.
        if (
          attempt < MAX_SLUG_RETRY_ATTEMPTS &&
          this.isArticleSlugConflict(error)
        ) {
          slug = await this.resolveSlug(baseSlug);
          continue;
        }
        throw error;
      }
    }
  }

  async update(id: string, dto: UpdateArticleDto) {
    const existing = await this.assertExists(id);
    if (
      dto.instagram_url?.trim() &&
      dto.instagram_url.trim() !== existing.instagramUrl
    ) {
      const duplicate = await this.findInstagramDuplicate(
        dto.instagram_url,
        id,
      );
      if (duplicate) {
        throw new ApiException(
          'INSTAGRAM_URL_DUPLICATE',
          'This Instagram post has already been added.',
          409,
          {
            existing_article_id: duplicate.id,
            existing_article_title: duplicate.title,
          },
        );
      }
    }
    let slug: string | undefined;
    if (dto.slug !== undefined) {
      slug = await this.resolveSlug(dto.slug, id);
    }

    for (let attempt = 0; ; attempt++) {
      try {
        const article = await this.prisma.article.update({
          where: { id },
          data: {
            slug,
            title: dto.title,
            excerpt: dto.excerpt,
            content:
              dto.content !== undefined
                ? sanitizeRichText(dto.content)
                : undefined,
            coverImageId: dto.cover_image_id,
            // Picking a structured category (even clearing it back to "none") retires the old
            // free-text value — going forward `categoryId` is the single source of truth for
            // this row, same as the LegalDocument categoryId/documentType relationship.
            categoryId:
              dto.category_id !== undefined
                ? emptyToNull(dto.category_id)
                : undefined,
            category: dto.category_id !== undefined ? null : undefined,
            tags: dto.tags,
            author: dto.author,
            featured: dto.featured,
            contentSource: dto.content_source,
            instagramCaption: dto.instagram_caption,
            instagramUrl: emptyToNull(dto.instagram_url),
            instagramPostId: dto.instagram_url
              ? (extractInstagramShortcode(dto.instagram_url) ?? undefined)
              : undefined,
            instagramImportedAt: dto.instagram_imported_at
              ? new Date(dto.instagram_imported_at)
              : undefined,
            instagramDate: dto.instagram_date
              ? new Date(dto.instagram_date)
              : undefined,
            instagramUsername: emptyToNull(dto.instagram_username),
            metaTitle: dto.meta_title,
            metaDescription: dto.meta_description,
            canonicalUrl: emptyToNull(dto.canonical_url),
            focusKeyword: dto.focus_keyword,
            ogImageId: emptyToNull(dto.og_image_id),
            keyTakeaways: dto.key_takeaways,
            quoteText: emptyToNull(dto.quote_text),
            quoteAuthor: emptyToNull(dto.quote_author),
            statistics: dto.statistics as never,
            readingTimeMinutes: dto.reading_time_minutes,
            // `status`/`publishedAt` are deliberately never written here — see `publish()`/
            // `unpublish()` below (Phase 5F-P0.2). Letting ordinary content edits also flip
            // publish state made the status field a label on an always-mutable row rather than a
            // real gate: any authenticated admin could publish/unpublish by including `status` in
            // an otherwise ordinary save. Publishing is now only ever reachable through the two
            // dedicated, `@Roles('super_admin')`-gated endpoints.
            translations: sanitizeTranslationsRichText(
              mergeTranslations(existing.translations, dto.translations),
              ['content'],
            ) as never,
          },
          include: DETAIL_INCLUDE,
        });
        return toArticleDetail(article);
      } catch (error) {
        // P2-1 — only re-resolves when this update actually writes `slug` (dto.slug !==
        // undefined); an update that never touches the slug column can't produce this
        // conflict, so it always falls through to `throw error;` on the first attempt. Mirrors
        // create()'s retry reasoning above.
        if (
          dto.slug !== undefined &&
          attempt < MAX_SLUG_RETRY_ATTEMPTS &&
          this.isArticleSlugConflict(error)
        ) {
          slug = await this.resolveSlug(dto.slug, id);
          continue;
        }
        throw error;
      }
    }
  }

  /** Per-locale coverage of the article's own master-content fields — mirrors
   * `ProductsService.getTranslationStatus()`. */
  async getTranslationStatus(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        translations: true,
        title: true,
        excerpt: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        quoteText: true,
      },
    });
    if (!article)
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);

    const sourceFields: Record<string, string | null> = {};
    for (const field of ArticlesService.TRANSLATABLE_ARTICLE_FIELDS) {
      sourceFields[field] = article[field];
    }
    return computeTranslationStatus(sourceFields, article.translations);
  }

  /** "Generate Translations" for Article — mirrors `ProductsService.generateTranslations()`
   * exactly, with one addition: `content` is rich HTML, so the freshly generated translation for
   * it must go through the same `sanitizeTranslationsRichText()` pass `update()` above already
   * applies to manually-typed translations, before the merged blob is persisted. The AI prompt
   * itself treats `content` as plain text (see `AiTranslationService.translateFields()`), so its
   * output can contain HTML the sanitizer needs to clean up exactly like any other source. */
  async generateTranslations(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        title: true,
        excerpt: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        quoteText: true,
        translations: true,
      },
    });
    if (!article)
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);

    const sourceFields: Record<string, string> = {};
    for (const field of ArticlesService.TRANSLATABLE_ARTICLE_FIELDS) {
      const value = article[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }

    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        article.translations,
      );

    if (mergedTranslations !== undefined) {
      await this.prisma.article.update({
        where: { id },
        data: {
          translations: sanitizeTranslationsRichText(mergedTranslations, [
            'content',
          ]) as never,
        },
      });
    }

    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }

  // ── Publish / Version History / Restore (Phase 5F-P0.2b-C) ─────────────────────────────

  private async buildSnapshotData(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: DETAIL_INCLUDE,
    });
    if (!article)
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    return article;
  }

  /** The only path that may move an Article into `published` — role-gated at the controller
   * (`@Roles('super_admin')`). Creates the next immutable `ArticlePublishedSnapshot` from the
   * CURRENT live row and flips visibility in one transaction, so there is never a moment where
   * `status='published'` exists without its snapshot (or vice versa) — mirrors
   * `ProductsService.publish()` exactly. Always creates a new version, even for a content-
   * unchanged republish after unpublishing — Product's own `publish()` has no "skip if
   * unchanged" logic either, so Article doesn't invent one. */
  async publish(id: string, actor: PublishActor) {
    await this.assertExists(id);
    const data = await this.buildSnapshotData(id);
    // P2-3 — the version read below and the create() inside the transaction are two separate
    // steps, so two concurrent publish() calls for the SAME article can both read the same
    // "last version" and both attempt to create the same next version; the DB's
    // `@@unique([articleId, version])` lets only one of them win. On that specific collision,
    // re-read the now-current latest version and retry, rather than surfacing a raw
    // unique-constraint error to the admin who did nothing wrong. Bounded so a systemic problem
    // (not an ordinary race) still fails loudly instead of looping forever. Mirrors
    // `ProductsService.publish()`'s identical retry.
    for (let attempt = 1; ; attempt++) {
      const last = await this.prisma.articlePublishedSnapshot.findFirst({
        where: { articleId: id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = (last?.version ?? 0) + 1;
      const now = new Date();
      // `buildSnapshotData()` reads the live row BEFORE this transaction updates it — its own
      // `status`/`publishedAt`/`lastPublishedAt`/`updatedAt` fields are therefore still the OLD
      // (pre-publish) values. Overriding them here with the same `now` this publish is actually
      // using is what makes the frozen blob self-consistent with the metadata columns beside
      // it: without this, `toArticleSummary`'s `article.publishedAt` (read straight from the
      // frozen data) would keep showing the PREVIOUS publish's date forever, confirmed live
      // during P0.2b-C verification (a v2 publish's public `published_at` stayed stuck at v1's
      // date). `restoreSnapshot()` deliberately does NOT do this — a restore's data must stay an
      // exact logical copy of the version being restored (brief §13).
      const snapshotData = {
        ...data,
        status: 'published' as const,
        publishedAt: now,
        lastPublishedAt: now,
        updatedAt: now,
      };
      try {
        const [snapshot] = await this.prisma.$transaction([
          this.prisma.articlePublishedSnapshot.create({
            data: {
              articleId: id,
              version,
              data: snapshotData as never,
              publishedById: actor.id,
              publishedByName: actor.name,
              publishedAt: now,
            },
          }),
          // `updatedAt` is pinned to the same `now` as `publishedAt`/`lastPublishedAt` —
          // otherwise Prisma's auto `@updatedAt` stamps a few ms later, which made a future
          // `has_unpublished_changes`-style check read "changed" immediately after every
          // publish. Same fix already proven in ProductsService.publish() — see its identical
          // comment.
          this.prisma.article.update({
            where: { id },
            data: {
              status: 'published',
              publishedAt: now,
              lastPublishedAt: now,
              updatedAt: now,
            },
          }),
        ]);
        // Emitted only after the transaction above has committed — snapshot creation + status
        // flip must succeed FIRST, so AI can never index a publish that failed. Only the id,
        // never the article payload itself; the AI listener re-reads through the normal
        // published-data path (`findPublishedBySlug`), never from the event (P0.2b-D, mirrors
        // `ProductsService.publish()`'s identical event emission).
        const event: ContentPublishedEvent = { source: 'news', entityId: id };
        this.events.emit(CONTENT_PUBLISHED_EVENT, event);
        return {
          id: snapshot.id,
          version: snapshot.version,
          published_at: snapshot.publishedAt.toISOString(),
        };
      } catch (error) {
        if (
          attempt < MAX_SNAPSHOT_VERSION_RETRY_ATTEMPTS &&
          this.isArticleSnapshotVersionConflict(error)
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  /** Role-gated at the controller, same as `publish()`. Takes the Article off the public site
   * without touching a single snapshot — every prior version stays exactly as it was, and
   * `publishedAt`/`lastPublishedAt` are deliberately left untouched (they record when the
   * Article was last published, which stays meaningful even while unpublished). Publishing
   * again later re-snapshots whatever is current in the draft row at that time, exactly like a
   * fresh publish — mirrors `ProductsService.unpublish()`. */
  async unpublish(id: string) {
    await this.assertExists(id);
    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'draft' },
      include: DETAIL_INCLUDE,
    });
    // Same event as publish()/restoreSnapshot() (P0.4-C1) — an unpublish is also a change to
    // what's publicly visible, so AI knowledge must resync to drop this article too. The
    // listener always triggers a full rebuild, which naturally stops re-extracting an article
    // that's no longer published rather than needing a separate "remove" signal.
    const event: ContentPublishedEvent = { source: 'news', entityId: id };
    this.events.emit(CONTENT_PUBLISHED_EVENT, event);
    return toArticleDetail(article);
  }

  /** Newest first, immutable — never mutates or deletes a row, only ever reads. Deliberately
   * returns `published_by_id` alongside `published_by_name` (unlike
   * `ProductsService.listSnapshots()`, which omits the id) per this phase's explicit brief. */
  async listSnapshots(articleId: string) {
    await this.assertExists(articleId);
    const snapshots = await this.prisma.articlePublishedSnapshot.findMany({
      where: { articleId },
      orderBy: { version: 'desc' },
      take: SNAPSHOT_LIST_LIMIT,
      select: {
        id: true,
        version: true,
        publishedAt: true,
        publishedById: true,
        publishedByName: true,
      },
    });
    return snapshots.map((s) => ({
      id: s.id,
      version: s.version,
      published_at: s.publishedAt.toISOString(),
      published_by_id: s.publishedById,
      published_by_name: s.publishedByName,
    }));
  }

  /** Never mutates or deletes a snapshot — restoring re-`create`s a brand-new row copying the
   * selected version's frozen `data` verbatim (same builder/shape as `publish()`, never a
   * second snapshot format), so it becomes the new latest while every prior version (including
   * the one live right before this restore) stays exactly as it was. The new snapshot always
   * records the ADMIN PERFORMING THE RESTORE as publisher, never the original snapshot's
   * publisher — a restore is a new publishing act. Mirrors `ProductsService.restoreSnapshot()`. */
  async restoreSnapshot(
    articleId: string,
    snapshotId: string,
    actor: PublishActor,
  ) {
    // Scoping the lookup by both id AND articleId in one query means a snapshot id that
    // belongs to a different Article is indistinguishable from "not found" — same safe
    // NOT_FOUND-only error surface as Product's, never leaking which Article actually owns it.
    const source = await this.prisma.articlePublishedSnapshot.findFirst({
      where: { id: snapshotId, articleId },
    });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Snapshot not found.', 404);
    // P2-3 — see publish()'s identical comment above: closes the TOCTOU race between the
    // version read and the create() below.
    for (let attempt = 1; ; attempt++) {
      const last = await this.prisma.articlePublishedSnapshot.findFirst({
        where: { articleId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = (last?.version ?? 0) + 1;
      const now = new Date();
      try {
        const [snapshot] = await this.prisma.$transaction([
          this.prisma.articlePublishedSnapshot.create({
            data: {
              articleId,
              version,
              data: source.data as never,
              publishedById: actor.id,
              publishedByName: actor.name,
              publishedAt: now,
            },
          }),
          // Same `now`-pinning as publish() — see that method's identical comment.
          this.prisma.article.update({
            where: { id: articleId },
            data: {
              status: 'published',
              publishedAt: now,
              lastPublishedAt: now,
              updatedAt: now,
            },
          }),
        ]);
        // A restore is a publish of an old snapshot — the public site changes exactly like a
        // fresh publish, so it must trigger the same AI resync. Only the id, never the
        // payload — same rule as publish(). Emitted only after the transaction above has
        // committed.
        const restoreEvent: ContentPublishedEvent = {
          source: 'news',
          entityId: articleId,
        };
        this.events.emit(CONTENT_PUBLISHED_EVENT, restoreEvent);
        return {
          id: snapshot.id,
          version: snapshot.version,
          published_at: snapshot.publishedAt.toISOString(),
        };
      } catch (error) {
        if (
          attempt < MAX_SNAPSHOT_VERSION_RETRY_ATTEMPTS &&
          this.isArticleSnapshotVersionConflict(error)
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  /** Lightweight lookup used by the controller to revalidate the right public URL after a
   * publish/unpublish/restore. Mirrors `ProductsService.getSlug()`. */
  async getSlug(id: string): Promise<string | null> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { slug: true },
    });
    return article?.slug ?? null;
  }

  /** True only for the unique-constraint violation on `Article.slug` — never a false positive
   * on some other unrelated DB error. Defense-in-depth for the TOCTOU race between
   * `resolveSlug()`'s read-loop and the actual `create()`/`update()` write: two concurrent
   * requests can both see the same slug as free before either commits. Mirrors
   * `ProductsService.isProductSlugConflict()`'s proven dual-shape check (P2-1) for the identical
   * Prisma-7 driver-adapter quirk: `P2002` is Prisma's documented "unique constraint failed"
   * code, but under Prisma 7's driver-adapter architecture this can instead surface as the
   * generic unmapped code `P2039`, with the real Postgres SQLSTATE (`23505` = `unique_violation`)
   * preserved at `error.meta.driverAdapterError.cause.originalCode`. Unlike Product, a recognized
   * conflict here does NOT become a user-facing error — the caller re-resolves the next
   * available suffix and retries instead, preserving Article's existing "always succeeds"
   * slug-collision behavior. */
  private isArticleSlugConflict(error: unknown): boolean {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };
    if (err.code === 'P2002') {
      return !err.meta?.target || err.meta.target.includes('slug');
    }
    return (
      err.code === 'P2039' &&
      err.meta?.driverAdapterError?.cause?.originalCode === '23505'
    );
  }

  /** True only for the unique-constraint violation on `ArticlePublishedSnapshot`'s
   * `(article_id, version)` pair — never a false positive on some other unrelated DB error.
   * Closes the TOCTOU race (P2-3) between the `orderBy: { version: 'desc' }` read in
   * publish()/restoreSnapshot() and the actual `create()`: two concurrent requests for the SAME
   * article can both read the same "last version" and both attempt to create the same next
   * version. Mirrors `isArticleSlugConflict()`'s/`ProductsService.isProductSnapshotVersionConflict()`'s
   * proven dual-shape check for the identical Prisma-7 driver-adapter quirk: `P2002` is
   * Prisma's documented "unique constraint failed" code, but under Prisma 7's driver-adapter
   * architecture this can instead surface as the generic unmapped code `P2039`, with the real
   * Postgres SQLSTATE (`23505` = `unique_violation`) preserved at
   * `error.meta.driverAdapterError.cause.originalCode`. */
  private isArticleSnapshotVersionConflict(error: unknown): boolean {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };
    if (err.code === 'P2002') {
      return !err.meta?.target || err.meta.target.includes('version');
    }
    return (
      err.code === 'P2039' &&
      err.meta?.driverAdapterError?.cause?.originalCode === '23505'
    );
  }

  /** True only for the FK RESTRICT violation on `ArticlePublishedSnapshot.articleId` — never a
   * false positive on some other unrelated DB error. Checks BOTH shapes because they were
   * empirically found to differ from what `ProductsService.remove()`'s identical pattern
   * assumes: `P2003` is Prisma's documented "foreign key constraint failed" code, but under
   * Prisma 7's driver-adapter architecture this specific RESTRICT violation was confirmed live
   * (P0.2b-C hotfix) to actually surface as the generic unmapped-error code `P2039`, with the
   * real Postgres SQLSTATE (`23001` = `restrict_violation`) preserved at
   * `error.meta.driverAdapterError.cause.originalCode`. Reading these internal fields never
   * leaks anything — only the fixed message below ever reaches the response body. */
  private isArticleDeleteRestrictedByPublishHistory(error: unknown): boolean {
    const err = error as {
      code?: string;
      meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
    };
    if (err.code === 'P2003') return true;
    return (
      err.code === 'P2039' &&
      err.meta?.driverAdapterError?.cause?.originalCode === '23001'
    );
  }

  async remove(id: string) {
    await this.assertExists(id);
    try {
      await this.prisma.article.delete({ where: { id } });
    } catch (error) {
      if (this.isArticleDeleteRestrictedByPublishHistory(error)) {
        // Mirrors ProductsService.remove()'s PRODUCT_HAS_PUBLISHED_HISTORY pattern — the FK on
        // ArticlePublishedSnapshot.articleId has no onDelete: Cascade specifically so this fails
        // instead of silently erasing publish history (P0.2b-A/C hotfix).
        throw new ApiException(
          'ARTICLE_HAS_PUBLISHED_HISTORY',
          'This article has published version history and cannot be permanently deleted. Unpublish it first if you want to remove it from the public site.',
          409,
        );
      }
      throw error;
    }
    return { deleted: true };
  }

  /** Always creates a Draft, never live — recurring Instagram content (brief §22) shouldn't
   * risk a second copy of the same post going out just because a slug/date was left as-is. */
  async duplicate(id: string) {
    const source = await this.prisma.article.findUnique({ where: { id } });
    if (!source) {
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    }
    const slug = await this.resolveSlug(`${source.title} copy`);
    const article = await this.prisma.article.create({
      data: {
        slug,
        title: `${source.title} — Copy`,
        excerpt: source.excerpt,
        content: source.content,
        coverImageId: source.coverImageId,
        categoryId: source.categoryId,
        category: source.category,
        tags: source.tags,
        author: source.author,
        featured: false,
        contentSource: source.contentSource,
        instagramCaption: source.instagramCaption,
        // The URL/shortcode are intentionally NOT carried over — a duplicated draft with the
        // same Instagram URL as its source would immediately trip duplicate-detection the
        // moment the Admin tries to publish it, and two articles legitimately should not both
        // reference the exact same source post.
        instagramUrl: null,
        instagramPostId: null,
        instagramImportedAt: null,
        instagramDate: source.instagramDate,
        instagramUsername: source.instagramUsername,
        metaTitle: source.metaTitle,
        metaDescription: source.metaDescription,
        canonicalUrl: null,
        focusKeyword: source.focusKeyword,
        ogImageId: source.ogImageId,
        keyTakeaways: source.keyTakeaways,
        quoteText: source.quoteText,
        quoteAuthor: source.quoteAuthor,
        statistics: source.statistics as never,
        readingTimeMinutes: source.readingTimeMinutes,
        status: 'draft',
        publishedAt: null,
        translations: source.translations as never,
        galleryImages: {
          create: (
            await this.prisma.articleGalleryImage.findMany({
              where: { articleId: id },
              orderBy: { order: 'asc' },
            })
          ).map((image) => ({
            mediaId: image.mediaId,
            caption: image.caption,
            altText: image.altText,
            order: image.order,
          })),
        },
      },
      include: DETAIL_INCLUDE,
    });
    return toArticleDetail(article);
  }

  /** Matches by shortcode first (survives trailing-slash/query-string/subdomain differences),
   * falling back to an exact URL match for rows written before `instagramPostId` existed. */
  private async findInstagramDuplicate(url: string, excludeId?: string) {
    const shortcode = extractInstagramShortcode(url);
    const article = await this.prisma.article.findFirst({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          ...(shortcode ? [{ instagramPostId: shortcode }] : []),
          { instagramUrl: url.trim() },
        ],
      },
      select: { id: true, title: true },
    });
    return article;
  }

  /** Import from Instagram (brief §05/56) — validates the URL, checks for a duplicate, then
   * attempts to fetch public metadata via Meta's oEmbed API. Instagram's oEmbed endpoint has
   * required an app-issued access token since ~2020; without one (or if the call fails) this
   * degrades to `{available:false}` rather than throwing, so the Admin UI can fall straight
   * into the manual-entry flow (brief §07) instead of showing a fatal error. Never scrapes —
   * only ever calls Meta's own documented endpoint.
   */
  async fetchInstagramMetadata(
    url: string,
  ): Promise<InstagramImportResult | InstagramDuplicateResult> {
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) {
      return {
        available: false,
        reason: 'invalid_url',
        message: 'Please enter a valid Instagram post URL.',
      };
    }

    const duplicate = await this.findInstagramDuplicate(url);
    if (duplicate) {
      return {
        duplicate: true,
        existing_article_id: duplicate.id,
        existing_article_title: duplicate.title,
      };
    }

    const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        available: false,
        reason: 'not_configured',
        message:
          'Instagram content could not be imported automatically — no API access token is configured. Continue manually below.',
      };
    }

    try {
      const oembedUrl = new URL(
        'https://graph.facebook.com/v19.0/instagram_oembed',
      );
      oembedUrl.searchParams.set('url', url.trim());
      oembedUrl.searchParams.set('access_token', accessToken);
      const response = await fetch(oembedUrl, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`oEmbed responded ${response.status}`);
      const data = (await response.json()) as {
        author_name?: string;
        title?: string;
        thumbnail_url?: string;
      };
      return {
        available: true,
        post_id: shortcode,
        username: data.author_name ?? null,
        caption: data.title ?? null,
        thumbnail_url: data.thumbnail_url ?? null,
        permalink: url.trim(),
      };
    } catch {
      return {
        available: false,
        reason: 'fetch_failed',
        message:
          'Instagram content could not be imported automatically. Continue manually below.',
      };
    }
  }

  private async resolveSlug(base: string, excludeId?: string) {
    const root = slugify(base) || 'article';
    let slug = root;
    let suffix = 2;
    while (await this.slugTaken(slug, excludeId)) {
      slug = `${root}-${suffix++}`;
    }
    return slug;
  }

  private async slugTaken(slug: string, excludeId?: string) {
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    return Boolean(existing && existing.id !== excludeId);
  }

  private async assertExists(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article)
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    return article;
  }

  // ── Categories ──────────────────────────────────────────────────────
  async findCategories() {
    await this.ensureCategoriesSeeded();
    const categories = await this.prisma.articleCategory.findMany({
      orderBy: { order: 'asc' },
    });
    return categories.map((c) => toArticleCategory(c));
  }

  /** Seeds the ten categories the brief lists, once, only when the table is empty — same
   * "seed then fully hand off to Admin" convention as `ensureLegalCategoriesSeeded()`. */
  private async ensureCategoriesSeeded() {
    const count = await this.prisma.articleCategory.count();
    if (count > 0) return;
    await this.prisma.articleCategory.createMany({
      data: DEFAULT_ARTICLE_CATEGORIES.map((name, order) => ({
        name,
        slug: slugify(name),
        order,
      })),
      skipDuplicates: true,
    });
  }

  async createCategory(dto: CreateArticleCategoryDto) {
    const count = await this.prisma.articleCategory.count();
    const category = await this.prisma.articleCategory.create({
      data: {
        name: dto.name,
        slug: await this.uniqueCategorySlug(slugify(dto.name)),
        description: emptyToNull(dto.description),
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toArticleCategory(category);
  }

  async updateCategory(id: string, dto: UpdateArticleCategoryDto) {
    const existing = await this.assertCategoryExists(id);
    const category = await this.prisma.articleCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: emptyToNull(dto.description),
        order: dto.order,
        active: dto.active,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
    return toArticleCategory(category);
  }

  /** Per-locale coverage of the category's own name/description — mirrors
   * `getTranslationStatus()` above, just for the category's smaller field set. */
  async getCategoryTranslationStatus(id: string) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { id },
      select: { translations: true, name: true, description: true },
    });
    if (!category)
      throw new ApiException('NOT_FOUND', 'Category not found.', 404);

    const sourceFields: Record<string, string | null> = {};
    for (const field of ArticlesService.TRANSLATABLE_CATEGORY_FIELDS) {
      sourceFields[field] = category[field];
    }
    return computeTranslationStatus(sourceFields, category.translations);
  }

  /** "Generate Translations" for an article category — mirrors `generateTranslations()` above.
   * Neither `name` nor `description` is rich text, so no sanitizer pass is needed here. */
  async generateCategoryTranslations(id: string) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { id },
      select: { name: true, description: true, translations: true },
    });
    if (!category)
      throw new ApiException('NOT_FOUND', 'Category not found.', 404);

    const sourceFields: Record<string, string> = {};
    for (const field of ArticlesService.TRANSLATABLE_CATEGORY_FIELDS) {
      const value = category[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }

    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        category.translations,
      );

    if (mergedTranslations !== undefined) {
      await this.prisma.articleCategory.update({
        where: { id },
        data: { translations: mergedTranslations as never },
      });
    }

    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }

  /** Deleting a category must not delete the articles filed under it — the FK is
   * `onDelete: SetNull`, so they become uncategorised and stay editable. */
  async removeCategory(id: string) {
    await this.assertCategoryExists(id);
    await this.prisma.articleCategory.delete({ where: { id } });
    return { deleted: true };
  }

  private async uniqueCategorySlug(base: string) {
    let slug = base || 'category';
    let suffix = 2;
    while (await this.prisma.articleCategory.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private async assertCategoryExists(id: string) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { id },
    });
    if (!category)
      throw new ApiException('NOT_FOUND', 'Category not found.', 404);
    return category;
  }

  // ── Gallery (Instagram carousel / article image gallery) ─────────────
  async addGalleryItem(articleId: string, dto: AddArticleGalleryItemDto) {
    await this.assertExists(articleId);
    const count = await this.prisma.articleGalleryImage.count({
      where: { articleId },
    });
    await this.prisma.articleGalleryImage.create({
      data: {
        articleId,
        mediaId: dto.media_id,
        caption: dto.caption,
        altText: dto.alt_text,
        order: count,
      },
    });
    return this.findByIdForAdmin(articleId);
  }

  async updateGalleryItem(
    articleId: string,
    galleryId: string,
    dto: UpdateArticleGalleryItemDto,
  ) {
    await this.assertGalleryItemExists(galleryId);
    await this.prisma.articleGalleryImage.update({
      where: { id: galleryId },
      data: {
        caption: dto.caption,
        altText: dto.alt_text,
        order: dto.order,
      },
    });
    return this.findByIdForAdmin(articleId);
  }

  async removeGalleryItem(articleId: string, galleryId: string) {
    await this.assertGalleryItemExists(galleryId);
    await this.prisma.articleGalleryImage.delete({ where: { id: galleryId } });
    return this.findByIdForAdmin(articleId);
  }

  private async assertGalleryItemExists(id: string) {
    const item = await this.prisma.articleGalleryImage.findUnique({
      where: { id },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery image not found.', 404);
  }
}
