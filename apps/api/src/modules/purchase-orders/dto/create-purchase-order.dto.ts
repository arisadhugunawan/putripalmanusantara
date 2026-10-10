import { IsISO8601, IsOptional, IsString } from 'class-validator';

// `supplierQuotationId` comes from the route, `supplierCompanyId`/`currency`/items/pricing are
// all derived server-side from the selected SupplierQuotation — none of them have a field here
// at all. Only administrative, non-commercial input is accepted at creation.
export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsISO8601()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
