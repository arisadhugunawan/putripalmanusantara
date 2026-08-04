import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

const CATEGORIES = ['product', 'facility', 'production', 'drone'] as const;

export class GalleryQueryDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: (typeof CATEGORIES)[number];
}

export class CreateGalleryItemDto {
  @IsString()
  @MinLength(1)
  media_id!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateGalleryItemDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: (typeof CATEGORIES)[number];

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}
