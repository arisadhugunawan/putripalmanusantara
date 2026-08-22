import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const ACCORDION_MODES = ['single', 'multiple'] as const;

export class UpdateAboutCompanyFacilitiesFaqSectionDto {
  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(ACCORDION_MODES)
  accordion_mode?: string;

  @IsOptional()
  @IsString()
  cta_title?: string;

  @IsOptional()
  @IsString()
  cta_description?: string;

  @IsOptional()
  @IsString()
  cta_primary_label?: string;

  @IsOptional()
  @IsString()
  cta_primary_href?: string;

  @IsOptional()
  @IsString()
  cta_secondary_label?: string;

  @IsOptional()
  @IsString()
  cta_secondary_href?: string;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class CreateFacilitiesFaqItemDto {
  @IsString()
  @MinLength(1)
  question!: string;

  @IsString()
  @MinLength(1)
  answer!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  highlight_text?: string;

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

export class UpdateFacilitiesFaqItemDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  highlight_text?: string;

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

export class CreateFacilitiesFaqProductTagDto {
  @IsString()
  @MinLength(1)
  faq_item_id!: string;

  @IsString()
  @MinLength(1)
  name!: string;

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

export class UpdateFacilitiesFaqProductTagDto {
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
