import type { LeadModel as Lead } from '../../../generated/prisma/models';

type LeadWithRelations = Lead & {
  company?: { id: string; name: string } | null;
  sourceInquiry?: {
    id: string;
    inquiryNumber: string;
    contactName: string;
    email: string;
    phone: string | null;
    companyName: string;
  } | null;
};

// Explicit allow-list, same discipline as Inquiry's/Admin business-relationship's mappers.
// `sourceInquiry` is only present when the caller's Prisma query actually included it (detail
// responses) — never the whole Inquiry object, per the locked decision.
export interface LeadSummary {
  id: string;
  leadNumber: string;
  companyId: string | null;
  company: { id: string; name: string } | null;
  sourceInquiryId: string | null;
  sourceQuotationRequestId: string | null;
  status: string;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  sourceInquiry?: {
    id: string;
    inquiryNumber: string;
    contactName: string;
    email: string;
    phone: string | null;
    companyName: string;
  };
}

export function toLead(lead: LeadWithRelations): LeadSummary {
  return {
    id: lead.id,
    leadNumber: lead.leadNumber,
    companyId: lead.companyId,
    company: lead.company ?? null,
    sourceInquiryId: lead.sourceInquiryId,
    sourceQuotationRequestId: lead.sourceQuotationRequestId,
    status: lead.status,
    ownerId: lead.ownerId,
    ownerName: lead.ownerName,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    ...(lead.sourceInquiry && { sourceInquiry: lead.sourceInquiry }),
  };
}
