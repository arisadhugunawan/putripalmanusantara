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

export const GALLERY_ADMIN_STATUSES = ['active', 'inactive'] as const;

/**
 * `page` has no default — its presence is how the controller tells apart "the admin Gallery
 * list page asked for a page" from "some other admin surface asked for the full list" (the
 * Admin Dashboard and the Gallery overview page's stat tiles both call `GET /admin/gallery`
 * with no query params and need every item back, unpaginated, exactly as before Phase 5C).
 */
export class GalleryQueryDto {
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
  @IsString()
  category_id?: string;

  /** Maps to `GalleryItem.active` — `active`/`inactive` reads better in a filter dropdown than
   * a raw boolean, and matches the `status` naming already used by Products/Articles/Media. */
  @IsOptional()
  @IsIn(GALLERY_ADMIN_STATUSES)
  status?: (typeof GALLERY_ADMIN_STATUSES)[number];
}
