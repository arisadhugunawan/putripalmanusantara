import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PurchaseRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    'draft',
    'submitted',
    'approved',
    'rejected',
    'cancelled',
    'converted',
  ])
  status?:
    'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'converted';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
