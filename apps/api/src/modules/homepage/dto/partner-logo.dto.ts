import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePartnerLogoDto {
  @IsString()
  @MinLength(1)
  logo_id!: string;

  @IsString()
  @MinLength(1)
  partner_name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsBoolean()
  open_in_new_tab?: boolean;

  @IsOptional()
  @IsString()
  alt_text?: string;

  // Free-text, not IsIn against a fixed list — the brief explicitly asks for
  // admin-extensible categories (see PARTNER_LOGO_SUGGESTED_CATEGORIES in shared-types).
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdatePartnerLogoDto {
  @IsOptional()
  @IsString()
  logo_id?: string;

  @IsOptional()
  @IsString()
  partner_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsBoolean()
  open_in_new_tab?: boolean;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
