import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  IsOptionalEmail,
  IsOptionalPhone,
  IsOptionalUrl,
} from '../../about-company/dto/optional-contact.validators';
import type { TranslationsInput } from '../../../common/dto/translations.dto';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateContactPageSettingsDto {
  @IsOptionalEmail()
  email?: string;

  @IsOptionalPhone()
  whatsapp_number?: string;

  @IsOptional()
  @IsArray()
  @IsIn(WEEKDAYS, { each: true })
  business_hours_open_days?: string[];

  @IsOptional()
  @IsString()
  @Matches(TIME_RE, { message: 'Gunakan format waktu HH:mm (mis. 08:00).' })
  business_hours_open_time?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_RE, { message: 'Gunakan format waktu HH:mm (mis. 17:00).' })
  business_hours_close_time?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-12)
  @Max(14)
  business_hours_utc_offset?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  hero_eyebrow?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  hero_heading?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  hero_description?: string;

  @IsOptional()
  @IsString()
  hero_image_id?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  hero_overlay_opacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  hero_cta_primary_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  hero_cta_secondary_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  buyer_cta_heading?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  buyer_cta_description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  buyer_cta_button_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplier_cta_heading?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  supplier_cta_description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  supplier_cta_button_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  supplier_cta_whatsapp_message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  whatsapp_message_greeting?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  whatsapp_message_intro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  whatsapp_message_product_list_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  whatsapp_message_closing?: string;

  @IsOptional()
  @IsString()
  main_map_location_id?: string | null;

  /** Non-English overrides for the hero copy and WhatsApp message template. Not deep-validated
   * (admin-only input), matching every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

const LOCATION_TYPES = ['head_office', 'operational', 'business'];

export class CreateContactLocationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsIn(LOCATION_TYPES)
  location_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsString()
  @MinLength(1)
  address!: string;

  @IsOptionalUrl()
  google_maps_url?: string;

  @IsOptionalPhone()
  phone?: string | null;

  @IsOptionalEmail()
  email?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateContactLocationDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(LOCATION_TYPES)
  location_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  address?: string;

  @IsOptionalUrl()
  google_maps_url?: string;

  @IsOptionalPhone()
  phone?: string | null;

  @IsOptionalEmail()
  email?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Non-English overrides for `label` only. Not deep-validated (admin-only input), matching
   * every other translation-bearing DTO in this codebase. */
  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
