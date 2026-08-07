import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateHeroSlideDto {
  @IsOptional()
  @IsString()
  desktop_image_id?: string;

  @IsOptional()
  @IsString()
  mobile_image_id?: string;

  @IsString()
  @MinLength(1)
  heading!: string;

  @IsString()
  @MinLength(1)
  subheading!: string;

  @IsOptional()
  @IsString()
  button_1_text?: string;

  @IsOptional()
  @IsString()
  button_1_link?: string;

  @IsOptional()
  @IsString()
  button_2_text?: string;

  @IsOptional()
  @IsString()
  button_2_link?: string;

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
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsString()
  button_1_text?: string;

  @IsOptional()
  @IsString()
  button_1_link?: string;

  @IsOptional()
  @IsString()
  button_2_text?: string;

  @IsOptional()
  @IsString()
  button_2_link?: string;

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
  @IsObject()
  translations?: TranslationsInput;
}
