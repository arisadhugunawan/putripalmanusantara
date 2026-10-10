import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SupplierQuotationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    'draft',
    'received',
    'under_review',
    'selected',
    'rejected',
    'expired',
    'cancelled',
  ])
  status?:
    | 'draft'
    | 'received'
    | 'under_review'
    | 'selected'
    | 'rejected'
    | 'expired'
    | 'cancelled';

  @IsOptional()
  @IsString()
  supplierRfqId?: string;

  @IsOptional()
  @IsString()
  supplierCompanyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
