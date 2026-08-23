import { Transform } from 'class-transformer';
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
import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';

const OVERLAY_TYPES = ['dark', 'light', 'green', 'gradient'] as const;
const POSITIONS = [
  'center',
  'center_top',
  'center_bottom',
  'left',
  'right',
] as const;
const HEIGHT_PRESETS = ['compact', 'standard', 'tall'] as const;

/** Every field optional/nullable — `null` deliberately clears the page-specific override back
 * to "inherit from Global Default" (PATCH-style partial update), `undefined` leaves it
 * untouched. Used for both a page-specific row and the reserved "global-default" row. */
export class UpdatePageHeaderDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  background_image_id?: string | null;

  @IsOptional()
  @IsString()
  mobile_background_image_id?: string | null;

  @IsOptional()
  @IsString()
  alt_text?: string | null;

  @IsOptional()
  @IsString()
  custom_title?: string | null;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  /** Non-English overrides for `custom_title`/`subtitle`. Not deep-validated (admin-only
   * input), matching every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;

  @IsOptional()
  @IsBoolean()
  overlay_enabled?: boolean | null;

  @IsOptional()
  @IsIn(OVERLAY_TYPES)
  overlay_type?: (typeof OVERLAY_TYPES)[number] | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  overlay_opacity?: number | null;

  @IsOptional()
  @IsIn(POSITIONS)
  background_position?: (typeof POSITIONS)[number] | null;

  @IsOptional()
  @IsIn(POSITIONS)
  mobile_background_position?: (typeof POSITIONS)[number] | null;

  @IsOptional()
  @IsIn(HEIGHT_PRESETS)
  height_preset?: (typeof HEIGHT_PRESETS)[number] | null;

  @IsOptional()
  @IsString()
  title_color?: string | null;

  @IsOptional()
  @IsString()
  subtitle_color?: string | null;

  @IsOptional()
  @IsString()
  breadcrumb_color?: string | null;

  @IsOptional()
  @IsBoolean()
  show_breadcrumb?: boolean | null;
}
