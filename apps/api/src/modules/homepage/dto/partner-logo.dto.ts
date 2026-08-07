import type { TranslationsInput } from '../../../common/dto/translations.dto';
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

const CATEGORIES = [
  'government',
  'certification',
  'logistics',
  'association',
  'bank',
  'other',
];

export class CreatePartnerLogoDto {
  @IsString()
  @MinLength(1)
  logo_id!: string;

  @IsString()
  @MinLength(1)
  partner_name!: string;

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdatePartnerLogoDto {
  @IsOptional()
  @IsString()
  logo_id?: string;

  @IsOptional()
  @IsString()
  partner_name?: string;

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
