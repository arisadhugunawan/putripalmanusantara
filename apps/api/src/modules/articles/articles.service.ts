import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
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
import type {
  InstagramDuplicateResult,
  InstagramImportResult,
} from '@ppn/shared-types';

const SORT_FIELD_MAP: Record<string, string> = {
  published_at: 'publishedAt',
  created_at: 'createdAt',
  title: 'title',
};

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

const SUMMARY_INCLUDE = { coverImage: true, categoryRef: true };
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

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──────────────────────────────────────────────────────────
  async findPublished(query: ArticleQueryDto) {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'publishedAt';

    const where = {
      status: 'published' as const,
      ...(query.category_id ? { categoryId: query.category_id } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.q?.trim()
        ? {
            OR: [
              {
                title: {
                  contains: query.q.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                excerpt: {
                  contains: query.q.trim(),
                  mode: 'insensitive' as const,
                },
              },
              { tags: { has: query.q.trim() } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: SUMMARY_INCLUDE,
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map((article) => toArticleSummary(article, query.locale)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findLatest(locale?: string) {
    const items = await this.prisma.article.findMany({
      where: { status: 'published' },
      include: SUMMARY_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return items.map((article) => toArticleSummary(article, locale));
  }

  /** Category chips on the public listing page only offer categories that actually have
   * something to show, and never the ones an Admin has deactivated. */
  async findPublicCategories() {
    const categories = await this.prisma.articleCategory.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    return categories.map((c) => toArticleCategory(c));
  }

  async findPublishedBySlug(slug: string, locale?: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: 'published' },
      include: DETAIL_INCLUDE,
    });
    if (!article) {
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    }
    return toArticleDetail(article, locale);
  }

  /** Related Insights — matched by category first, since Article has no tag-similarity
   * scoring; falls back to latest published articles when the article has no category or
   * too few matches, so the block is never empty just because a category is niche. */
  async findRelated(articleId: string, locale?: string, take = 3) {
    const source = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { categoryId: true, category: true },
    });
    if (!source) return [];

    const byCategory = source.categoryId
      ? await this.prisma.article.findMany({
          where: {
            status: 'published',
            id: { not: articleId },
            categoryId: source.categoryId,
          },
          include: SUMMARY_INCLUDE,
          orderBy: { publishedAt: 'desc' },
          take,
        })
      : [];

    if (byCategory.length >= take) {
      return byCategory.map((a) => toArticleSummary(a, locale));
    }

    const fallback = await this.prisma.article.findMany({
      where: {
        status: 'published',
        id: { notIn: [articleId, ...byCategory.map((a) => a.id)] },
      },
      include: SUMMARY_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: take - byCategory.length,
    });

    return [...byCategory, ...fallback].map((a) => toArticleSummary(a, locale));
  }

  // ── Admin ───────────────────────────────────────────────────────────
  async findAllForAdmin() {
    const items = await this.prisma.article.findMany({
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((article) => toArticleDetail(article));
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
    const slug = await this.resolveSlug(dto.slug || dto.title);
    const article = await this.prisma.article.create({
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
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
        status: dto.status ?? 'draft',
        publishedAt: dto.status === 'published' ? new Date() : null,
        translations: dto.translations,
      },
      include: DETAIL_INCLUDE,
    });
    return toArticleDetail(article);
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
    const justPublished =
      dto.status === 'published' && existing.status !== 'published';

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
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
        status: dto.status,
        publishedAt: justPublished ? new Date() : undefined,
        translations: dto.translations,
      },
      include: DETAIL_INCLUDE,
    });
    return toArticleDetail(article);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.article.delete({ where: { id } });
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
    await this.assertCategoryExists(id);
    const category = await this.prisma.articleCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: emptyToNull(dto.description),
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toArticleCategory(category);
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
