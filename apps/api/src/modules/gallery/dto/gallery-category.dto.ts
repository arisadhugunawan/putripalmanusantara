import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/** Lowercase-dash slug, e.g. "coconut-sorting" — matches the pattern already used for other
 * slug-like identifiers in this codebase (product slugs, article slugs). */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateGalleryCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  /** Optional — the service derives one from `name` when omitted. */
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
  })
  slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateGalleryCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
