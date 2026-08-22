import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ARTICLE_ADMIN_STATUSES = ['draft', 'published'] as const;
export const ARTICLE_CONTENT_TYPES = ['website', 'instagram'] as const;
export const ARTICLE_ADMIN_SORTS = [
  '-published_at',
  'published_at',
  '-featured',
] as const;

/**
 * `page` has no default — its presence is how the controller tells apart "the admin Articles
 * list page asked for a page" from "some other admin surface asked for the full list" (the
 * Admin Dashboard and the article-preview-by-id lookup both call `GET /admin/articles` with no
 * query params and need every article back, unpaginated, exactly as before Phase 5C).
 */
export class AdminArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsIn(ARTICLE_ADMIN_STATUSES)
  status?: (typeof ARTICLE_ADMIN_STATUSES)[number];

  /** Plain string, not `@Type(() => Boolean)` — class-transformer's naive `Boolean(value)`
   * would turn the query string `"false"` into `true`. Parsed explicitly in the service. */
  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: 'true' | 'false';

  /** Category *slug*, matching what the existing category `<select>` has always used as its
   * option value — not `category_id`, to avoid an extra id lookup on the frontend. */
  @IsOptional()
  @IsString()
  category?: string;

  /** Replicates the old client-side "Website Articles"/"Instagram Content" tabs: `website`
   * means "not instagram-only" (i.e. `website` or `both`), `instagram` means "not website-only"
   * (i.e. `instagram` or `both`) — the same non-exclusive logic the tabs already had. */
  @IsOptional()
  @IsIn(ARTICLE_CONTENT_TYPES)
  content_type?: (typeof ARTICLE_CONTENT_TYPES)[number];

  @IsOptional()
  @IsIn(ARTICLE_ADMIN_SORTS)
  sort: (typeof ARTICLE_ADMIN_SORTS)[number] = '-published_at';
}
