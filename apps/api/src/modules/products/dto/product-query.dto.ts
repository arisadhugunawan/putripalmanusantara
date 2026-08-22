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

export const PRODUCT_STATUSES = ['draft', 'published'] as const;

/**
 * `page` has no default — its presence is how the controller tells apart "the admin Products
 * list page asked for a page" from "some other admin surface asked for the full list" (the
 * Homepage pickers, Admin Dashboard stat counts, and WhatWeDoEditor all call `GET /admin/products`
 * with no query params at all and need every product back, unpaginated, exactly as before Phase
 * 5C — see admin-products.controller.ts `findAll()`).
 */
export class ProductQueryDto {
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
  @IsIn(PRODUCT_STATUSES)
  status?: (typeof PRODUCT_STATUSES)[number];

  /** Plain string, not `@Type(() => Boolean)` — class-transformer's naive `Boolean(value)`
   * would turn the query string `"false"` into `true`. Parsed explicitly in the service. */
  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: 'true' | 'false';
}
