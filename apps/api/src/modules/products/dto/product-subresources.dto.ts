import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class AddProductGalleryItemDto {
  @IsString()
  @MinLength(1)
  media_id!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateProductGalleryItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpsertProductSpecificationDto {
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

export class UpsertProductDownloadDto {
  @IsString()
  @MinLength(1)
  file_name!: string;

  @IsString()
  @MinLength(1)
  file_url!: string;
}

export class UpsertProductPackagingApplicationDto {
  @IsIn(['packaging', 'application'])
  type!: 'packaging' | 'application';

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  media_id?: string;
}
