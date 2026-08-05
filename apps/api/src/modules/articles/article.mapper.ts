import type {
  ArticleDetail,
  ArticleSummary,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  ArticleModel as Article,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type ArticleWithCover = Article & { coverImage: Media | null };

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

export function toArticleSummary(
  article: ArticleWithCover,
  locale: string = DEFAULT_LOCALE,
): ArticleSummary {
  const t = translate(article, article.translations, locale, [
    'title',
    'excerpt',
    'category',
  ]);
  return {
    id: article.id,
    slug: article.slug,
    title: t.title,
    excerpt: t.excerpt,
    cover_image: article.coverImage ? toMedia(article.coverImage) : null,
    category: t.category,
    author: article.author,
    published_at: (article.publishedAt ?? article.createdAt).toISOString(),
  };
}

export function toArticleDetail(
  article: ArticleWithCover,
  locale: string = DEFAULT_LOCALE,
): ArticleDetail {
  const t = translate(article, article.translations, locale, [
    'content',
    'metaTitle',
    'metaDescription',
  ]);
  return {
    ...toArticleSummary(article, locale),
    content: t.content,
    meta_title: t.metaTitle,
    meta_description: t.metaDescription,
    status: article.status,
    created_at: article.createdAt.toISOString(),
    updated_at: article.updatedAt.toISOString(),
    translations: article.translations as ArticleDetail['translations'],
  };
}
