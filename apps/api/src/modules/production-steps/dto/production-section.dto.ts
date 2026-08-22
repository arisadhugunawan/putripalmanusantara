import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateHomepageProcessSectionDto {
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
  @IsObject()
  translations?: TranslationsInput;
}
