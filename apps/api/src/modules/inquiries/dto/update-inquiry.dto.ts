import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// System-owned fields (inquiryNumber/source/sourceQuotationRequestId/createdAt/updatedAt) are
// absent here, same discipline as CreateInquiryDto — they can never be touched through this DTO.
export class UpdateInquiryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  companyName?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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

  @IsOptional()
  @IsIn(['new', 'contacted', 'converted', 'closed'])
  status?: 'new' | 'contacted' | 'converted' | 'closed';
}
