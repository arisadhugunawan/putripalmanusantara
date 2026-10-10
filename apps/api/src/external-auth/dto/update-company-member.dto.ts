import { IsIn, IsOptional } from 'class-validator';

// Both fields are optional but at least one must be present (enforced in
// ExternalCompanyMemberService.updateMember, not here) — a single PATCH covers approve/suspend
// (via `status`) and role change (via `role`) per the Phase 17A-proposed API surface. Only the
// two legal target values are accepted for each; the service further restricts which *current*
// state may transition into them (e.g. `status: 'active'` is only honored from `pending`).
export class UpdateCompanyMemberDto {
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';

  @IsOptional()
  @IsIn(['owner', 'member'])
  role?: 'owner' | 'member';
}
