import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { TranslationsInput } from '../../../common/dto/translations.dto';

const OVERLAY_TYPES = [
  'dark_green',
  'charcoal',
  'black',
  'green_gradient',
] as const;
const POSITIONS = [
  'center',
  'center_top',
  'center_bottom',
  'left',
  'right',
] as const;

export class UpdateFooterSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  show_cta?: boolean;

  @IsOptional()
  @IsBoolean()
  show_social?: boolean;

  @IsOptional()
  @IsBoolean()
  show_contact?: boolean;

  @IsOptional()
  @IsBoolean()
  show_navigation?: boolean;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Non-English overrides for `tagline`/`description`. Not deep-validated (admin-only
   * input), matching every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;

  @IsOptional()
  @IsString()
  background_image_id?: string | null;

  @IsOptional()
  @IsString()
  mobile_background_image_id?: string | null;

  @IsOptional()
  @IsString()
  background_alt_text?: string | null;

  @IsOptional()
  @IsIn(OVERLAY_TYPES)
  overlay_type?: (typeof OVERLAY_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  overlay_opacity?: number;

  @IsOptional()
  @IsIn(POSITIONS)
  background_position?: (typeof POSITIONS)[number];

  @IsOptional()
  @IsIn(POSITIONS)
  mobile_background_position?: (typeof POSITIONS)[number];

  @IsOptional()
  @IsString()
  cta_headline?: string;

  @IsOptional()
  @IsString()
  cta_description?: string;

  @IsOptional()
  @IsString()
  cta_primary_text?: string;

  @IsOptional()
  @IsString()
  cta_secondary_text?: string;
}
