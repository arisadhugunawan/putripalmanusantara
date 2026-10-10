import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

// `supplierQuotationId`/`supplierCompanyId`/`currency`/`items`/pricing fields are absent — the
// commercial snapshot is fixed at creation. `status` excludes `draft` (nothing transitions back
// into it) and `partially_received`/`received`/`closed` — those receiving-dependent
// transitions are not available until a future Receiving phase exists (locked decision 21).
export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsISO8601()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['issued', 'confirmed', 'cancelled'])
  status?: 'issued' | 'confirmed' | 'cancelled';
}
