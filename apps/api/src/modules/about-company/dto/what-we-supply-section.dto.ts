import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateAboutCompanyWhatWeDoSectionDto {
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
  who_heading?: string;

  @IsOptional()
  @IsString()
  who_description?: string;

  @IsOptional()
  @IsString()
  buyer_cta_heading?: string;

  @IsOptional()
  @IsString()
  buyer_cta_description?: string;

  @IsOptional()
  @IsString()
  buyer_cta_button_text?: string;

  @IsOptional()
  @IsString()
  supplier_cta_heading?: string;

  @IsOptional()
  @IsString()
  supplier_cta_description?: string;

  @IsOptional()
  @IsString()
  supplier_cta_button_text?: string;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
