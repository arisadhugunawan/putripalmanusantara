import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OpportunityQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    'prospecting',
    'qualification',
    'proposal',
    'negotiation',
    'won',
    'lost',
  ])
  stage?:
    | 'prospecting'
    | 'qualification'
    | 'proposal'
    | 'negotiation'
    | 'won'
    | 'lost';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
