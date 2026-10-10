import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReceivingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['draft', 'received', 'inspecting', 'completed', 'cancelled'])
  status?: 'draft' | 'received' | 'inspecting' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
