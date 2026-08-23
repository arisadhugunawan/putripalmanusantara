import { PRODUCT_MEDIA_SECTIONS } from '@ppn/shared-types';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { TranslationsInput } from '../../../common/dto/translations.dto';

export class AddProductGalleryItemDto {
  @IsString()
  @MinLength(1)
  media_id!: string;

  @IsOptional()
  @IsIn(PRODUCT_MEDIA_SECTIONS)
  section?: string;

  @IsOptional()
  @IsString()
  caption?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateProductGalleryItemDto {
  @IsOptional()
  @IsIn(PRODUCT_MEDIA_SECTIONS)
  section?: string;

  @IsOptional()
  @IsString()
  caption?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpsertProductSpecificationDto {
  @IsString()
  @MinLength(1)
  spec_key!: string;

  @IsString()
  @MinLength(1)
  spec_value!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsIn(['specification', 'export_info', 'detail_info'])
  group?: 'specification' | 'export_info' | 'detail_info';

  @IsOptional()
  @IsString()
  variant_label?: string | null;

  /** Non-English overrides for spec_key/spec_value. Not deep-validated (admin-only input),
   * matching every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpsertProductDownloadDto {
  @IsString()
  @MinLength(1)
  file_name!: string;

  @IsString()
  @MinLength(1)
  file_url!: string;
}

export class UpsertProductPackagingApplicationDto {
  @IsIn(['packaging', 'application'])
  type!: 'packaging' | 'application';

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  media_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  /** Non-English overrides for title/description. Not deep-validated (admin-only input),
   * matching every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpsertProductShapeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  media_id?: string | null;

  /** Free text, one size per line — kept verbatim (see ProductShape in the schema). */
  @IsOptional()
  @IsString()
  sizes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  /** Non-English overrides for name/sizes. Not deep-validated (admin-only input), matching
   * every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
