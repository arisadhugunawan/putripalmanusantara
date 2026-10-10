import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

// `purchaseRequestId` comes from the route, items are copied entirely from the
// PurchaseRequest's own items (no client override — see SupplierRfqsService), and
// `supplierRfqNumber`/`status`/timestamps are all server-controlled. `supplierCompanyId` is the
// one genuinely new input this endpoint needs: which candidate supplier this particular
// SupplierRFQ is being sent to (one PurchaseRequest fans out into several of these, one per
// supplier).
export class CreateSupplierRfqDto {
  @IsString()
  @MinLength(1)
  supplierCompanyId!: string;

  @IsOptional()
  @IsISO8601()
  requestedAt?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
