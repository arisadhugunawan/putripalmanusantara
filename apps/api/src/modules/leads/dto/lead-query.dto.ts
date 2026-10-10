import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class LeadQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'])
  status?:
    'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
