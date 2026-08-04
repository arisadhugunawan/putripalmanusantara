import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFacilityDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  cover_image_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateFacilityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cover_image_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class AddFacilityGalleryItemDto {
  @IsString()
  @MinLength(1)
  media_id!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}
