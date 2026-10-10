import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// No `ownerId` filter — RFQ has no ownership field (locked decision 3). No `currency` filter —
// RFQ has no currency field; pricing lives on the future Quotation.
export class RfqQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['draft', 'submitted', 'reviewing', 'quoted', 'rejected', 'cancelled'])
  status?:
    'draft' | 'submitted' | 'reviewing' | 'quoted' | 'rejected' | 'cancelled';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  opportunityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
