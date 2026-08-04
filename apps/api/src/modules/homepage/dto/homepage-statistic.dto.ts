import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class HomepageStatisticItemDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsString()
  @MinLength(1)
  value!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class ReplaceHomepageStatisticsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomepageStatisticItemDto)
  statistics!: HomepageStatisticItemDto[];
}
