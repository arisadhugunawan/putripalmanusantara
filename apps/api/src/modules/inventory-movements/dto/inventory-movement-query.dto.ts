import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InventoryMovementQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    'receiving',
    'transfer_in',
    'transfer_out',
    'adjustment_in',
    'adjustment_out',
    'production_in',
    'production_out',
    'packing_in',
    'packing_out',
  ])
  movementType?:
    | 'receiving'
    | 'transfer_in'
    | 'transfer_out'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'production_in'
    | 'production_out'
    | 'packing_in'
    | 'packing_out';

  @IsOptional()
  @IsString()
  inventoryId?: string;

  @IsOptional()
  @IsString()
  inventoryLotId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}
