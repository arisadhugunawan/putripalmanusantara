import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePartnersSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  // 35-45s is the brief's recommended range; bounds are widened slightly (15-90) so the
  // "Slow/Normal/Fast/Custom" presets in the admin UI all stay valid.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(90)
  marquee_duration_seconds?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
