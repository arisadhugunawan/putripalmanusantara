import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

// `quotationId`/`companyId`/`currency`/`items`/pricing fields are absent — the commercial
// snapshot is fixed at creation (locked decision 27/32). `status` excludes `draft` (nothing
// transitions back into it) and `partially_fulfilled` (no fulfillment-tracking data exists yet
// to justify it — locked decision 30); the service layer further locks `requestedDeliveryDate`
// once the order has left `draft`, mirroring SalesQuotationsService's own draft-vs-non-draft
// field-locking discipline.
export class UpdateSalesOrderDto {
  @IsOptional()
  @IsISO8601()
  requestedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['confirmed', 'processing', 'fulfilled', 'cancelled'])
  status?: 'confirmed' | 'processing' | 'fulfilled' | 'cancelled';
}
