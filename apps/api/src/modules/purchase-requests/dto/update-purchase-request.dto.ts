import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

// `items`/`requestNumber`/`requestedById`/`requestedByName` are absent — items are fixed at
// creation (locked decision 6) and the requester identity is fixed at creation too. `status`
// excludes `draft` (nothing transitions back into it) and `converted` (set only as the
// side-effect of a successful SupplierRFQ creation — never directly settable through this
// route, per locked decision "approval and conversion are separate application actions").
export class UpdatePurchaseRequestDto {
  @IsOptional()
  @IsISO8601()
  requiredDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['submitted', 'approved', 'rejected', 'cancelled'])
  status?: 'submitted' | 'approved' | 'rejected' | 'cancelled';
}
