import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductSpecificationInputDto {
  @IsString()
  @MinLength(1)
  spec_key!: string;

  @IsString()
  @MinLength(1)
  spec_value!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsIn(['specification', 'export_info'])
  group?: 'specification' | 'export_info';
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  category!: string;

  @IsString()
  @MinLength(1)
  short_description!: string;

  @IsString()
  @MinLength(1)
  full_description!: string;

  @IsOptional()
  @IsString()
  cover_image_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  meta_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  meta_description?: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationInputDto)
  specifications?: ProductSpecificationInputDto[];

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  full_description?: string;

  @IsOptional()
  @IsString()
  cover_image_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  meta_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  meta_description?: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}

export class SetFeaturedDto {
  @IsBoolean()
  is_featured!: boolean;
}
