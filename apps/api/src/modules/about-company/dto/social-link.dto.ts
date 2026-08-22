import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAboutCompanySocialLinkDto {
  @IsString()
  @MinLength(1)
  platform!: string;

  @IsString()
  @MinLength(1)
  display_name!: string;

  @IsString()
  @MinLength(1)
  url!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  open_in_new_tab?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class SetCompanyProfileCountryVisibilityDto {
  @IsBoolean()
  show_in_company_profile!: boolean;
}

export class UpdateAboutCompanySocialLinkDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  platform?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  display_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  url?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  open_in_new_tab?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}
