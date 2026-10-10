import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PurchaseOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    'draft',
    'issued',
    'confirmed',
    'partially_received',
    'received',
    'cancelled',
    'closed',
  ])
  status?:
    | 'draft'
    | 'issued'
    | 'confirmed'
    | 'partially_received'
    | 'received'
    | 'cancelled'
    | 'closed';

  @IsOptional()
  @IsString()
  supplierQuotationId?: string;

  @IsOptional()
  @IsString()
  supplierCompanyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
