import type {
  ArticleCategoryRef,
  ArticleDetail,
  ArticleGalleryImage as SharedGalleryImage,
  ArticleStatistic,
  ArticleSummary,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  ArticleCategoryModel as CategoryModel,
  ArticleGalleryImageModel as GalleryImageModel,
  ArticleModel as Article,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';
import { sanitizeRichText } from '../../common/utils/sanitize-rich-text.util';
import { toArticleCategory } from './article-category.mapper';

type ArticleWithRelations = Article & {
  coverImage: Media | null;
  ogImage?: Media | null;
  categoryRef?: CategoryModel | null;
  galleryImages?: (GalleryImageModel & { media: Media })[];
};

function toMedia(media: Media): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType,
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    uploaded_at: media.uploadedAt.toISOString(),
  };
}

const WORDS_PER_MINUTE = 200;

/** Strips HTML tags before counting words — `content` is the TipTap editor's HTML output. */
function estimateReadingMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

function toStatistics(raw: unknown): ArticleStatistic[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is { value: string; label: string } =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { value: unknown }).value === 'string' &&
        typeof (item as { label: unknown }).label === 'string',
    )
    .map((item) => ({ value: item.value, label: item.label }))
    .filter((item) => item.value !== '' && item.label !== '');
}

function toCategoryRef(
  article: ArticleWithRelations,
  locale: string,
): ArticleCategoryRef | null {
  if (article.categoryRef) {
    const category = toArticleCategory(article.categoryRef, locale);
    return { id: category.id, name: category.name, slug: category.slug };
  }
  if (article.category) {
    return { id: null, name: article.category, slug: null };
  }
  return null;
}

export function toArticleSummary(
  article: ArticleWithRelations,
  locale: string = DEFAULT_LOCALE,
): ArticleSummary {
  const t = translate(article, article.translations, locale, [
    'title',
    'excerpt',
  ]);
  return {
    id: article.id,
    slug: article.slug,
    title: t.title,
    excerpt: t.excerpt,
    cover_image: article.coverImage ? toMedia(article.coverImage) : null,
    category: toCategoryRef(article, locale),
    author: article.author,
    published_at: (article.publishedAt ?? article.createdAt).toISOString(),
    featured: article.featured,
    content_source: article.contentSource,
    instagram_url: article.instagramUrl,
  };
}

export function toArticleDetail(
  article: ArticleWithRelations,
  locale: string = DEFAULT_LOCALE,
): ArticleDetail {
  const t = translate(article, article.translations, locale, [
    'content',
    'metaTitle',
    'metaDescription',
    'quoteText',
  ]);
  const galleryImages: SharedGalleryImage[] = (article.galleryImages ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      media: toMedia(item.media),
      caption: item.caption,
      alt_text: item.altText,
      order: item.order,
    }));

  return {
    ...toArticleSummary(article, locale),
    // Read-time defense-in-depth on top of the write-time sanitization in
    // ArticlesService.create()/update() — belt-and-suspenders against any row saved before this
    // fix shipped, with zero database migration needed (sanitizing already-clean HTML is a
    // no-op, so this is safe to apply unconditionally to every read).
    content: sanitizeRichText(t.content),
    meta_title: t.metaTitle,
    meta_description: t.metaDescription,
    canonical_url: article.canonicalUrl,
    focus_keyword: article.focusKeyword,
    og_image: article.ogImage ? toMedia(article.ogImage) : null,
    status: article.status,
    tags: article.tags,
    gallery_images: galleryImages,
    instagram_caption: article.instagramCaption,
    instagram_date: article.instagramDate?.toISOString() ?? null,
    instagram_username: article.instagramUsername,
    instagram_post_id: article.instagramPostId,
    instagram_imported_at: article.instagramImportedAt?.toISOString() ?? null,
    key_takeaways: article.keyTakeaways,
    quote_text: t.quoteText,
    quote_author: article.quoteAuthor,
    statistics: toStatistics(article.statistics),
    reading_time_minutes:
      article.readingTimeMinutes ?? estimateReadingMinutes(article.content),
    reading_time_override: article.readingTimeMinutes,
    created_at: article.createdAt.toISOString(),
    updated_at: article.updatedAt.toISOString(),
    translations: article.translations as ArticleDetail['translations'],
  };
}
