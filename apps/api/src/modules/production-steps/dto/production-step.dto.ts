import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { PRODUCTION_STEP_ICON_KEYS } from '@ppn/shared-types';
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

export class CreateProductionStepDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsIn(PRODUCTION_STEP_ICON_KEYS)
  icon?: string;

  @IsOptional()
  @IsString()
  illustration_id?: string;

  @IsOptional()
  @IsString()
  cta_label?: string;

  @IsOptional()
  @IsString()
  cta_href?: string;

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

export class UpdateProductionStepDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PRODUCTION_STEP_ICON_KEYS)
  icon?: string;

  @IsOptional()
  @IsString()
  illustration_id?: string | null;

  @IsOptional()
  @IsString()
  cta_label?: string | null;

  @IsOptional()
  @IsString()
  cta_href?: string | null;

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
