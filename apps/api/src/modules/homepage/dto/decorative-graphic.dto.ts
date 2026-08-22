import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const VARIANTS = [
  'leaf_outline',
  'coconut_cross_section',
  'ship_outline',
  'compass',
  'world_map_outline',
  'palm_leaf',
  'coconut_tree_silhouette',
  'container_outline',
];

const PLACEMENTS = [
  'hero_behind_content',
  'top_left',
  'top_right',
  'bottom_left',
  'bottom_right',
  'center_background',
];

export class CreateDecorativeGraphicDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsIn(VARIANTS)
  variant!: string;

  @IsIn(PLACEMENTS)
  placement!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.1)
  opacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(2)
  scale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateDecorativeGraphicDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsIn(VARIANTS)
  variant?: string;

  @IsOptional()
  @IsIn(PLACEMENTS)
  placement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.1)
  opacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(2)
  scale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
