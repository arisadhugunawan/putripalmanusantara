import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

// `rfqNumber`/`opportunityId`/`companyId`/`items`/`createdAt`/`updatedAt` are all absent —
// source lineage and items are fixed after creation (locked decision 9/17), and company/
// opportunity are historical provenance, never editable. `quoted` is deliberately excluded from
// the accepted status values — it is reserved exclusively for the future Quotation phase.
export class UpdateRfqDto {
  @IsOptional()
  @IsISO8601()
  requestedAt?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['submitted', 'reviewing', 'rejected', 'cancelled'])
  status?: 'submitted' | 'reviewing' | 'rejected' | 'cancelled';
}
