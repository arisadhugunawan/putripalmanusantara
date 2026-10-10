import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// `productId`/`productNameSnapshot`/`quantityExpected`/`unit` are all server-derived from the
// resolved `PurchaseOrderItem` — none of them have a field here at all (locked decision 9).
// `purchaseOrderItemId` is required in v1 (locked decision 3) — there is no free-form,
// PO-item-less ReceivingItem.
export class CreateReceivingItemDto {
  @IsString()
  @MinLength(1)
  purchaseOrderItemId!: string;

  @IsNumber()
  @Min(0.01)
  quantityReceived!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// `purchaseOrderId` comes from the route, `supplierCompanyId`/`receivingNumber`/`status`/
// `receivedAt`/timestamps are all server-controlled — none of them have a field here at all.
export class CreateReceivingDto {
  @IsString()
  @MinLength(1)
  warehouseId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReceivingItemDto)
  items!: CreateReceivingItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
