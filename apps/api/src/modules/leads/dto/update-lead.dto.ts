import { IsIn, IsOptional, IsString } from 'class-validator';

// System-owned fields (leadNumber/sourceInquiryId/sourceQuotationRequestId/createdAt/updatedAt)
// are absent here, same discipline as Inquiry's update DTO — source lineage is historical
// provenance, never editable. `status` deliberately excludes `'converted'` — Phase 18C must
// never produce that value; it belongs exclusively to Phase 18D's own future atomic
// Lead→Opportunity action, never to a generic PATCH.
export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsIn(['new', 'contacted', 'qualified', 'unqualified', 'lost'])
  status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'lost';
}
