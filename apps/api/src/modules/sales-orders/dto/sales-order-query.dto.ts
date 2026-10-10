import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// No `ownerId` filter — SalesOrder has no ownership field (same gap already found on RFQ and
// Quotation).
export class SalesOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    'draft',
    'confirmed',
    'processing',
    'partially_fulfilled',
    'fulfilled',
    'cancelled',
  ])
  status?:
    | 'draft'
    | 'confirmed'
    | 'processing'
    | 'partially_fulfilled'
    | 'fulfilled'
    | 'cancelled';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  quotationId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
