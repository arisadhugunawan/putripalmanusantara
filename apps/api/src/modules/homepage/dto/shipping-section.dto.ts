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
  Max,
  Min,
} from 'class-validator';

export class UpdateShippingSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  // Brief's recommended speed is 30-50px/sec (slow/premium) — expressed here as a loop
  // duration in seconds, same "Slow/Normal/Fast/Custom" preset pattern as
  // HomepagePartnersSection's marquee_duration_seconds.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(120)
  marquee_duration_seconds?: number;

  @IsOptional()
  @IsBoolean()
  show_partner_name?: boolean;

  @IsOptional()
  @IsBoolean()
  show_relationship_type?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
