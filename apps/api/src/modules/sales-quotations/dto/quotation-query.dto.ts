import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// No `ownerId` filter — Quotation has no ownership field (same gap already found on RFQ).
export class QuotationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled'])
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  rfqId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
