import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InventoryLotQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['quarantine', 'available', 'hold', 'rejected', 'consumed', 'closed'])
  status?:
    'quarantine' | 'available' | 'hold' | 'rejected' | 'consumed' | 'closed';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  receivingId?: string;

  @IsOptional()
  @IsString()
  receivingItemId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
