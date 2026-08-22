import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAboutCompanyProfileDto {
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  main_description?: string;

  @IsOptional()
  @IsString()
  vision?: string;

  @IsOptional()
  @IsString()
  mission?: string;

  @IsOptional()
  @IsString()
  company_overview?: string;

  @IsOptional()
  @IsString()
  main_image_id?: string | null;

  // ── Storytelling blocks ───────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsString()
  cta_label?: string | null;

  @IsOptional()
  @IsString()
  cta_href?: string | null;

  @IsOptional()
  @IsString()
  youtube_video_url?: string | null;

  @IsOptional()
  @IsString()
  social_label?: string;

  @IsOptional()
  @IsBoolean()
  social_visible?: boolean;

  @IsOptional()
  @IsString()
  story_label?: string;

  @IsOptional()
  @IsString()
  story_heading?: string;

  @IsOptional()
  @IsString()
  story_description?: string;

  @IsOptional()
  @IsString()
  story_secondary_description?: string;

  @IsOptional()
  @IsString()
  story_image_id?: string | null;

  @IsOptional()
  @IsBoolean()
  story_visible?: boolean;

  @IsOptional()
  @IsString()
  scope_label?: string;

  @IsOptional()
  @IsString()
  scope_heading?: string;

  @IsOptional()
  @IsString()
  scope_description?: string;

  @IsOptional()
  @IsBoolean()
  scope_visible?: boolean;

  @IsOptional()
  @IsString()
  facts_label?: string;

  @IsOptional()
  @IsString()
  facts_heading?: string;

  @IsOptional()
  @IsBoolean()
  facts_visible?: boolean;

  @IsOptional()
  @IsString()
  export_label?: string;

  @IsOptional()
  @IsString()
  export_heading?: string;

  @IsOptional()
  @IsString()
  export_description?: string;

  @IsOptional()
  @IsBoolean()
  export_visible?: boolean;

  @IsOptional()
  @IsString()
  legal_label?: string;

  @IsOptional()
  @IsString()
  legal_heading?: string;

  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  registered_address?: string;

  @IsOptional()
  @IsString()
  business_id_number?: string;

  @IsOptional()
  @IsString()
  established_year?: string;

  @IsOptional()
  @IsBoolean()
  legal_visible?: boolean;

  @IsOptional()
  @IsString()
  closing_label?: string;

  @IsOptional()
  @IsString()
  closing_heading?: string;

  @IsOptional()
  @IsString()
  closing_description?: string;

  @IsOptional()
  @IsString()
  closing_cta_label?: string | null;

  @IsOptional()
  @IsString()
  closing_cta_href?: string | null;

  @IsOptional()
  @IsBoolean()
  closing_visible?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class CreateAboutCompanyFactDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  icon?: string | null;

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

export class UpdateAboutCompanyFactDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  icon?: string | null;

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

export class AddAboutCompanyGalleryItemDto {
  @IsString()
  media_id!: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  alt_text?: string;
}

export class UpdateAboutCompanyGalleryItemDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
