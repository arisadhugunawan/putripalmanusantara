import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { SHIPPING_RELATIONSHIP_TYPES } from '@ppn/shared-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateShippingPartnerDto {
  @IsString()
  @MinLength(1)
  logo_id!: string;

  @IsString()
  @MinLength(1)
  partner_name!: string;

  @IsOptional()
  @IsIn(SHIPPING_RELATIONSHIP_TYPES)
  relationship_type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsBoolean()
  open_in_new_tab?: boolean;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateShippingPartnerDto {
  @IsOptional()
  @IsString()
  logo_id?: string;

  @IsOptional()
  @IsString()
  partner_name?: string;

  @IsOptional()
  @IsIn(SHIPPING_RELATIONSHIP_TYPES)
  relationship_type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsBoolean()
  open_in_new_tab?: boolean;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
