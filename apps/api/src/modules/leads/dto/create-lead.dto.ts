import { IsOptional, IsString } from 'class-validator';

// Lead has very little client-settable surface on direct creation — `leadNumber`/`status`/
// `ownerId`/`ownerName`/`sourceInquiryId`/`sourceQuotationRequestId`/timestamps are all
// server-controlled (status always `new`, owner always null, source always null on this path —
// see LeadsService.create()). Owner is assigned later via PATCH, never at creation time, even
// for a direct (phone call/referral/trade fair) Lead.
export class CreateLeadDto {
  @IsOptional()
  @IsString()
  companyId?: string;
}
