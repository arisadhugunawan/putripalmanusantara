import { IsNumber, IsString, Min, MinLength } from 'class-validator';

// `inventoryLotId` comes from the route; `productId`/`unit` are derived server-side from the
// resolved InventoryLot — the client never supplies them (locked decision 25). `warehouseId`/
// `warehouseLocationId`/`quantity` are the genuinely client-controlled placement inputs.
export class CreateInventoryDto {
  @IsString()
  @MinLength(1)
  warehouseId!: string;

  @IsString()
  @MinLength(1)
  warehouseLocationId!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;
}
