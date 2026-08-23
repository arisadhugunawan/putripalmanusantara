import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import {
  SUPPLY_NETWORK_ICON_KEYS,
  SUPPLY_NETWORK_POSITIONS,
} from '@ppn/shared-types';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSupplyNetworkItemDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  short_title?: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsIn(SUPPLY_NETWORK_ICON_KEYS)
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
  @IsIn(SUPPLY_NETWORK_POSITIONS)
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateSupplyNetworkItemDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  short_title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(SUPPLY_NETWORK_ICON_KEYS)
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
  @IsIn(SUPPLY_NETWORK_POSITIONS)
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
