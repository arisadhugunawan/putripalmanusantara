import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

// The body for POST .../opportunities/from-lead/:leadId. `opportunityNumber`/`leadId`/
// `companyId`/`stage`/`ownerId`/`ownerName`/timestamps are all server-controlled (leadId comes
// from the route, companyId/owner are propagated from the Lead, stage always starts
// `prospecting`) and deliberately absent here — see OpportunitiesService.createFromLead().
export class CreateOpportunityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

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
}
