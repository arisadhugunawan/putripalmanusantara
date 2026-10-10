import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

// `purchaseRequestId`/`supplierCompanyId`/`supplierRfqNumber`/`items` are absent — lineage and
// items are fixed after creation. `status` excludes `draft` (nothing transitions back into it)
// and `quoted` (set only as the side-effect of a SupplierQuotation being created — never
// directly settable through this route).
export class UpdateSupplierRfqDto {
  @IsOptional()
  @IsISO8601()
  requestedAt?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['sent', 'reviewing', 'rejected', 'cancelled'])
  status?: 'sent' | 'reviewing' | 'rejected' | 'cancelled';
}
