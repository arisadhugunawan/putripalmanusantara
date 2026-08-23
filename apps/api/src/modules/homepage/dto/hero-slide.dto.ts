import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const BUTTON_STYLES = ['primary', 'secondary'];
const TEXT_ALIGNMENTS = ['left', 'center', 'right'];

export class CreateHeroSlideDto {
  @IsOptional()
  @IsString()
  desktop_image_id?: string;

  @IsOptional()
  @IsString()
  mobile_image_id?: string;

  @IsOptional()
  @IsString()
  eyebrow_text?: string;

  @IsString()
  @MinLength(1)
  heading!: string;

  @IsString()
  @MinLength(1)
  subheading!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  button_1_text?: string;

  @IsOptional()
  @IsString()
  button_1_link?: string;

  @IsOptional()
  @IsBoolean()
  button_1_enabled?: boolean;

  @IsOptional()
  @IsIn(BUTTON_STYLES)
  button_1_style?: string;

  @IsOptional()
  @IsString()
  button_2_text?: string;

  @IsOptional()
  @IsString()
  button_2_link?: string;

  @IsOptional()
  @IsBoolean()
  button_2_enabled?: boolean;

  @IsOptional()
  @IsIn(BUTTON_STYLES)
  button_2_style?: string;

  @IsOptional()
  @IsIn(TEXT_ALIGNMENTS)
  text_alignment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  overlay_opacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsDateString()
  publish_date?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateHeroSlideDto {
  @IsOptional()
  @IsString()
  desktop_image_id?: string;

  @IsOptional()
  @IsString()
  mobile_image_id?: string;

  @IsOptional()
  @IsString()
  eyebrow_text?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  button_1_text?: string;

  @IsOptional()
  @IsString()
  button_1_link?: string;

  @IsOptional()
  @IsBoolean()
  button_1_enabled?: boolean;

  @IsOptional()
  @IsIn(BUTTON_STYLES)
  button_1_style?: string;

  @IsOptional()
  @IsString()
  button_2_text?: string;

  @IsOptional()
  @IsString()
  button_2_link?: string;

  @IsOptional()
  @IsBoolean()
  button_2_enabled?: boolean;

  @IsOptional()
  @IsIn(BUTTON_STYLES)
  button_2_style?: string;

  @IsOptional()
  @IsIn(TEXT_ALIGNMENTS)
  text_alignment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  overlay_opacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsDateString()
  publish_date?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
