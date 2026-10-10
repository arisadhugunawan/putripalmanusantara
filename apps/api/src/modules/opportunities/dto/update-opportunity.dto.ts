import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

// `opportunityNumber`/`leadId`/`companyId`/`createdAt`/`updatedAt` are absent here — `leadId`
// in particular is historical lineage, never editable, same discipline as Lead's own
// `sourceInquiryId`/`sourceQuotationRequestId`.
export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

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
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsISO8601()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;
}
