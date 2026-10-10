import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InquiryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['new', 'contacted', 'converted', 'closed'])
  status?: 'new' | 'contacted' | 'converted' | 'closed';

  @IsOptional()
  @IsIn(['website', 'quotation_request', 'business_network', 'manual'])
  source?: 'website' | 'quotation_request' | 'business_network' | 'manual';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
