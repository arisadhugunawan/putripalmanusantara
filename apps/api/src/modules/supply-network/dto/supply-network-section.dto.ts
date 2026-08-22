import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateHomepageSupplyNetworkSectionDto {
  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  center_label?: string;

  @IsOptional()
  @IsString()
  center_title?: string;

  @IsOptional()
  @IsString()
  center_description?: string;

  @IsOptional()
  @IsString()
  final_heading?: string;

  @IsOptional()
  @IsString()
  final_description?: string;

  @IsOptional()
  @IsString()
  primary_cta_label?: string;

  @IsOptional()
  @IsString()
  primary_cta_href?: string;

  @IsOptional()
  @IsString()
  secondary_cta_label?: string;

  @IsOptional()
  @IsString()
  secondary_cta_href?: string;

  @IsOptional()
  @IsBoolean()
  enable_animation?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_rotate?: boolean;

  @IsOptional()
  @IsBoolean()
  particle_flow?: boolean;

  @IsOptional()
  @IsBoolean()
  hover_effect?: boolean;

  @IsOptional()
  @IsBoolean()
  effect_3d?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
