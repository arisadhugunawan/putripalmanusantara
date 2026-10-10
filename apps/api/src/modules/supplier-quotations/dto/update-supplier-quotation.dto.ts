import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// `supplierRfqId`/`supplierCompanyId`/`supplierQuotationNumber`/`items`/`subtotal`/`total` are
// absent — lineage, server-calculated totals, and items are all fixed after creation. `status`
// excludes `draft` (nothing transitions back into it).
export class UpdateSupplierQuotationDto {
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
  @IsIn([
    'received',
    'under_review',
    'selected',
    'rejected',
    'expired',
    'cancelled',
  ])
  status?:
    | 'received'
    | 'under_review'
    | 'selected'
    | 'rejected'
    | 'expired'
    | 'cancelled';
}
