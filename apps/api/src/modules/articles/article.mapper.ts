import type {
  ArticleDetail,
  ArticleSummary,
  Media as SharedMedia,
} from '@ppn/shared-types';
import type {
  ArticleModel as Article,
  MediaModel as Media,
} from '../../../generated/prisma/models';

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

export function toArticleSummary(article: ArticleWithCover): ArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    cover_image: article.coverImage ? toMedia(article.coverImage) : null,
    category: article.category,
    author: article.author,
    published_at: (article.publishedAt ?? article.createdAt).toISOString(),
  };
}

export function toArticleDetail(article: ArticleWithCover): ArticleDetail {
  return {
    ...toArticleSummary(article),
    content: article.content,
    meta_title: article.metaTitle,
    meta_description: article.metaDescription,
    status: article.status,
    created_at: article.createdAt.toISOString(),
    updated_at: article.updatedAt.toISOString(),
  };
}
