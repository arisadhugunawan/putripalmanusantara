import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { WORLD_COUNTRIES } from '@ppn/shared-types';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

const EXPORT_STATUSES = [
  'active_destination',
  'previous_destination',
  'potential_market',
  'inactive',
];

// Rejects any code not in the real ISO 3166-1 alpha-2 reference list — the brief is
// explicit that country codes must never be invented.
const VALID_COUNTRY_CODES = WORLD_COUNTRIES.map((c) => c.alpha2);

export class CreateExportDestinationDto {
  @IsString()
  @IsIn(VALID_COUNTRY_CODES)
  country_code!: string;

  @IsOptional()
  @IsIn(EXPORT_STATUSES)
  export_status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  export_volume?: string;

  @IsOptional()
  @IsString()
  export_frequency?: string;

  @IsOptional()
  @IsString()
  destination_port?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  product_ids?: string[];

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

export class UpdateExportDestinationDto {
  @IsOptional()
  @IsString()
  @IsIn(VALID_COUNTRY_CODES)
  country_code?: string;

  @IsOptional()
  @IsIn(EXPORT_STATUSES)
  export_status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  export_volume?: string;

  @IsOptional()
  @IsString()
  export_frequency?: string;

  @IsOptional()
  @IsString()
  destination_port?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  product_ids?: string[];

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
