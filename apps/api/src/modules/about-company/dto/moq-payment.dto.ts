import type { TranslationsInput } from '../../../common/dto/translations.dto';
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

const QUICK_CARD_ICONS = [
  'container',
  'payment',
  'shipping',
  'currency',
] as const;

export class UpdateAboutCompanyMoqPaymentSectionDto {
  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  introduction?: string;

  @IsOptional()
  @IsString()
  supply_capacity_title?: string;

  @IsOptional()
  @IsString()
  supply_capacity_description?: string;

  @IsOptional()
  @IsString()
  commitment_title?: string;

  @IsOptional()
  @IsString()
  commitment_description?: string;

  @IsOptional()
  @IsString()
  cta_title?: string;

  @IsOptional()
  @IsString()
  cta_description?: string;

  @IsOptional()
  @IsString()
  cta_button_label?: string;

  @IsOptional()
  @IsString()
  cta_button_href?: string;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class CreateMoqPaymentQuickCardDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsIn(QUICK_CARD_ICONS)
  icon?: string;

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

export class UpdateMoqPaymentQuickCardDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsIn(QUICK_CARD_ICONS)
  icon?: string;

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

export class CreateMoqPaymentBusinessTermDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsString()
  @MinLength(1)
  value!: string;

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

export class UpdateMoqPaymentBusinessTermDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  value?: string;

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
