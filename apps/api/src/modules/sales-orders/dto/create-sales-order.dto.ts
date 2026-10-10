import { IsISO8601, IsOptional, IsString } from 'class-validator';

// `quotationId` comes from the route, `companyId`/`currency`/pricing/items are all derived
// server-side from the accepted Quotation — none of them have a field here at all (locked
// decisions 7/8/13-24). Only administrative, non-commercial input is accepted at creation.
export class CreateSalesOrderDto {
  @IsOptional()
  @IsISO8601()
  requestedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
