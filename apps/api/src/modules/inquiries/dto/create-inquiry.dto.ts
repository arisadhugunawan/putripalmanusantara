import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// `source`/`status`/`inquiryNumber`/`sourceQuotationRequestId`/`id`/timestamps are all
// server-controlled and deliberately absent here — this DTO can never set them, not even by
// accident, since class-validator's whitelist mode strips anything not declared below.
export class CreateInquiryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  companyName!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  contactName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
