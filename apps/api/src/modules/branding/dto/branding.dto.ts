import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  header_logo_id?: string | null;

  @IsOptional()
  @IsBoolean()
  header_logo_enabled?: boolean;

  @IsOptional()
  @IsString()
  header_logo_alt?: string;

  @IsOptional()
  @IsString()
  footer_logo_id?: string | null;

  @IsOptional()
  @IsBoolean()
  footer_logo_enabled?: boolean;

  @IsOptional()
  @IsString()
  footer_logo_alt?: string;

  @IsOptional()
  @IsString()
  mobile_logo_id?: string | null;

  @IsOptional()
  @IsBoolean()
  use_mobile_logo?: boolean;

  @IsOptional()
  @IsString()
  mobile_logo_alt?: string;

  @IsOptional()
  @IsString()
  favicon_id?: string | null;

  @IsOptional()
  @IsString()
  product_header_background_id?: string | null;
}
