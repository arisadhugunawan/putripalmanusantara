import { PRODUCT_MEDIA_SECTIONS } from '@ppn/shared-types';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';

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

  /** Non-English overrides for spec_key/spec_value. Structurally normalized (unknown locale
   * keys / non-string field values silently dropped, see `normalizeTranslationsInput()`) but
   * not field-name-whitelisted — Phase P0.3-E pilot. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
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

  /** Non-English overrides for title/description. Structurally normalized (unknown locale
   * keys / non-string field values silently dropped, see `normalizeTranslationsInput()`) but
   * not field-name-whitelisted — Phase P0.3-E pilot. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
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

  /** Non-English overrides for name/sizes. Structurally normalized (unknown locale keys /
   * non-string field values silently dropped, see `normalizeTranslationsInput()`) but not
   * field-name-whitelisted — Phase P0.3-E pilot. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
