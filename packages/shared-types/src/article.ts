import type { Media } from "./media";
import type { Translations } from "./i18n";
import type { ContentStatus } from "./product";

/** Where an article's content originated — informational only (drives the Admin's content-type
 * badge), never gates publishing. */
export type ArticleContentSource = "website" | "instagram" | "both";

/** Admin-managed category — see `LegalDocumentCategory` for the identical pattern. */
export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Category as attached to an article. Real `ArticleCategory` rows carry an `id`/`slug`;
 * articles written before that table existed fall back to their old free-text `category`
 * column, shown here with `id`/`slug` as `null` so old content keeps displaying correctly
 * without a data migration. */
export interface ArticleCategoryRef {
  id: string | null;
  name: string;
  slug: string | null;
}

export interface ArticleGalleryImage {
  id: string;
  media: Media;
  caption: string | null;
  alt_text: string | null;
  order: number;
}

export interface ArticleStatistic {
  value: string;
  label: string;
}

/** Card / listing shape — GET /articles, /articles/latest */
export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: Media | null;
  category: ArticleCategoryRef | null;
  author: string;
  published_at: string;
  featured: boolean;
  /** Present on the summary (not just the detail shape) so cards can show an Instagram
   * badge/link without a second request per article. */
  content_source: ArticleContentSource;
  instagram_url: string | null;
}

/** Full detail shape — GET /articles/{slug}, and every Admin list/detail response. */
export interface ArticleDetail extends ArticleSummary {
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  focus_keyword: string | null;
  og_image: Media | null;
  status: ContentStatus;
  tags: string[];
  gallery_images: ArticleGalleryImage[];
  instagram_caption: string | null;
  instagram_date: string | null;
  instagram_username: string | null;
  /** Set only when fetched via the Import from Instagram flow — null for manual entries. */
  instagram_post_id: string | null;
  instagram_imported_at: string | null;
  key_takeaways: string[];
  quote_text: string | null;
  quote_author: string | null;
  statistics: ArticleStatistic[];
  /** Always populated: the Admin's manual override when set, otherwise auto-computed from
   * `content`'s word count (~200 wpm). Never `null` — the UI always has a number to show. */
  reading_time_minutes: number;
  /** The raw override value, `null` when auto-computed — Admin form needs this to know
   * whether to show the override field as blank (auto) or filled (manual). */
  reading_time_override: number | null;
  created_at: string;
  updated_at: string;
  /** Admin-only — see ProductDetail['translations']. */
  translations?: Translations | null;
}

/** Response of POST /admin/articles/instagram/fetch — result of attempting to retrieve
 * public post metadata for a pasted Instagram URL via Meta's oEmbed API. `available: false`
 * means the metadata could not be retrieved (no access token configured, or the fetch
 * itself failed) — the Admin UI falls back to manual entry in that case, it is never an
 * error the Admin has to work around. */
export type InstagramImportResult =
  | {
      available: true;
      post_id: string;
      username: string | null;
      caption: string | null;
      thumbnail_url: string | null;
      permalink: string;
    }
  | {
      available: false;
      reason: "not_configured" | "fetch_failed" | "invalid_url";
      message: string;
    };

/** Response of POST /admin/articles/instagram/fetch when the URL matches an article already
 * in the system — the Admin should not create a duplicate. */
export interface InstagramDuplicateResult {
  duplicate: true;
  existing_article_id: string;
  existing_article_title: string;
}
