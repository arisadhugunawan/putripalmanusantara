import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  assistant_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  desktop_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  mobile_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  business_instructions?: string;

  @IsOptional()
  @IsBoolean()
  include_home?: boolean;

  @IsOptional()
  @IsBoolean()
  include_about_company?: boolean;

  @IsOptional()
  @IsBoolean()
  include_products?: boolean;

  @IsOptional()
  @IsBoolean()
  include_facilities?: boolean;

  @IsOptional()
  @IsBoolean()
  include_moq_payment_terms?: boolean;

  @IsOptional()
  @IsBoolean()
  include_shipment_terms?: boolean;

  @IsOptional()
  @IsBoolean()
  include_faq?: boolean;

  @IsOptional()
  @IsBoolean()
  include_gallery?: boolean;

  @IsOptional()
  @IsBoolean()
  include_news?: boolean;

  @IsOptional()
  @IsBoolean()
  include_contact?: boolean;

  @IsOptional()
  @IsBoolean()
  include_legal_certificates?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsapp_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  whatsapp_display_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  whatsapp_general_message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  whatsapp_product_message?: string;
}
