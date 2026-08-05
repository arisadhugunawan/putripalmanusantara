import type { Media } from "./media";
import type { Translations } from "./i18n";
import type { ContentStatus } from "./product";

/** Card / listing shape — GET /articles, /articles/latest */
export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: Media | null;
  category: string | null;
  author: string;
  published_at: string;
}

/** Full detail shape — GET /articles/{slug} */
export interface ArticleDetail extends ArticleSummary {
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  /** Admin-only — see ProductDetail['translations']. */
  translations?: Translations | null;
}
