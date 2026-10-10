import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// `quotationNumber`/`rfqId`/`companyId`/`subtotal`/`total`/`items` are absent — lineage,
// server-calculated totals, and items are all fixed after creation (locked decisions 2/10/20).
// `status` excludes `draft` — nothing transitions back into it — and the service layer further
// rejects header-field edits once the record has left `draft` (locked decision 19).
export class UpdateQuotationDto {
  @IsOptional()
  @IsISO8601()
  quotationDate?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['sent', 'accepted', 'rejected', 'expired', 'cancelled'])
  status?: 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
}
