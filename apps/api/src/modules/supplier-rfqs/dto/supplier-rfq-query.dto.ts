import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SupplierRfqQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['draft', 'sent', 'reviewing', 'quoted', 'rejected', 'cancelled'])
  status?: 'draft' | 'sent' | 'reviewing' | 'quoted' | 'rejected' | 'cancelled';

  @IsOptional()
  @IsString()
  purchaseRequestId?: string;

  @IsOptional()
  @IsString()
  supplierCompanyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
