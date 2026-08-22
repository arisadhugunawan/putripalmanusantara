import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** `product_id` is an optional link to a real catalogue product (see WhatWeDoItem.product). */
export class CreateWhatWeDoItemDto {
  @IsOptional()
  @IsString()
  product_id?: string | null;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  detailed_description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  key_points?: string[];

  @IsOptional()
  @IsString()
  media_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateWhatWeDoItemDto {
  @IsOptional()
  @IsString()
  product_id?: string | null;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  detailed_description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  key_points?: string[];

  @IsOptional()
  @IsString()
  media_id?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
