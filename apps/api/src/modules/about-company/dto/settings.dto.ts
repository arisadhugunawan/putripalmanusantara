import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAboutCompanySettingsDto {
  @IsOptional()
  @IsString()
  page_title?: string;

  @IsOptional()
  @IsString()
  page_subtitle?: string;

  @IsOptional()
  @IsString()
  seo_title?: string;

  @IsOptional()
  @IsString()
  seo_description?: string;

  @IsOptional()
  @IsString()
  og_image_id?: string | null;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}
