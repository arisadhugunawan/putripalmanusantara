import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

// `receivingItemId` comes from the route; `productId`/`unit`/`receivingId`/`warehouseId`/
// `supplierCompanyId` are all derived server-side from the resolved ReceivingItem/Receiving —
// none of them have a field here at all (locked decision 1/5). `lotNumber`/`status` are
// server-controlled too — every lot starts `quarantine`, never client-chosen (locked decision
// 8). `quantity`/`origin` are the only genuinely client-controlled inputs.
export class CreateInventoryLotDto {
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsOptional()
  @IsString()
  origin?: string;
}
