import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** FR-QUOTE-02 / docs/05-api.md §3.9 — server-side validation for the quotation form. */
export class CreateQuotationRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  company!: string;

  @IsString()
  @MinLength(1)
  country!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  estimated_quantity?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsString()
  @MinLength(1)
  source_page!: string;

  /** Honeypot — must stay empty. A filled value flags the submission as spam. */
  @IsOptional()
  @IsString()
  website?: string;
}

/** docs/05-api.md §3.9 — general contact form. */
export class CreateContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  company!: string;

  @IsString()
  @MinLength(1)
  country!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  source_page?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateQuotationStatusDto {
  @IsIn(['new', 'in_progress', 'done'])
  status!: 'new' | 'in_progress' | 'done';
}

export class QuotationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['new', 'in_progress', 'done'])
  status?: 'new' | 'in_progress' | 'done';
}
