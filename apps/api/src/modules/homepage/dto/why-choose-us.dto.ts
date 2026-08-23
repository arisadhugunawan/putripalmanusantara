import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
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

const ICONS = [
  'quality',
  'supply',
  'export_ready',
  'consistency',
  'sustainability',
  'service',
  'pricing',
  'delivery',
];

export class CreateWhyChooseUsDto {
  @IsOptional()
  @IsIn(ICONS)
  icon?: string;

  @IsString()
  @MinLength(1)
  title!: string;

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
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateWhyChooseUsDto {
  @IsOptional()
  @IsIn(ICONS)
  icon?: string;

  @IsOptional()
  @IsString()
  title?: string;

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
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
