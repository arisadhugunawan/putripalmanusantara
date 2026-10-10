import { IsEmail } from 'class-validator';

// Identifies an existing ExternalAccount by email only — role/status are never client-supplied
// (always created as role=member, status=pending; see ExternalCompanyMemberService.addMember).
export class AddCompanyMemberDto {
  @IsEmail()
  email!: string;
}
