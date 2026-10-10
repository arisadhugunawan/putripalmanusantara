import type { OpportunityModel as Opportunity } from '../../../generated/prisma/models';

interface LeadSummary {
  id: string;
  leadNumber: string;
  ownerId: string | null;
  ownerName: string | null;
  sourceInquiry?: {
    id: string;
    inquiryNumber: string;
    contactName: string;
    email: string;
    phone: string | null;
    companyName: string;
  } | null;
}

type OpportunityWithRelations = Opportunity & {
  company?: { id: string; name: string } | null;
  lead?: LeadSummary | null;
};

// Explicit allow-list, same discipline as Lead's/Inquiry's mappers. `lead` (with its own nested
// `sourceInquiry`) is only present when the caller's Prisma query actually included it (detail
// responses) — never the full Lead or Inquiry object, per the locked decision.
export interface OpportunitySummary {
  id: string;
  opportunityNumber: string;
  leadId: string;
  companyId: string | null;
  company: { id: string; name: string } | null;
  name: string;
  stage: string;
  estimatedValue: string | null;
  currency: string | null;
  expectedCloseDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    leadNumber: string;
    ownerId: string | null;
    ownerName: string | null;
    sourceInquiry?: {
      id: string;
      inquiryNumber: string;
      contactName: string;
      email: string;
      phone: string | null;
      companyName: string;
    };
  };
}

export function toOpportunity(
  opportunity: OpportunityWithRelations,
): OpportunitySummary {
  return {
    id: opportunity.id,
    opportunityNumber: opportunity.opportunityNumber,
    leadId: opportunity.leadId,
    companyId: opportunity.companyId,
    company: opportunity.company ?? null,
    name: opportunity.name,
    stage: opportunity.stage,
    // Decimal → string, not Number(), to avoid any floating-point rounding of money values —
    // no existing mapper in this codebase handles a Decimal field yet (every other transactional
    // model with one is still schema-only), so there's no prior convention to diverge from.
    estimatedValue: opportunity.estimatedValue
      ? opportunity.estimatedValue.toString()
      : null,
    currency: opportunity.currency,
    expectedCloseDate: opportunity.expectedCloseDate
      ? opportunity.expectedCloseDate.toISOString()
      : null,
    ownerId: opportunity.ownerId,
    ownerName: opportunity.ownerName,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
    ...(opportunity.lead && {
      lead: {
        id: opportunity.lead.id,
        leadNumber: opportunity.lead.leadNumber,
        ownerId: opportunity.lead.ownerId,
        ownerName: opportunity.lead.ownerName,
        ...(opportunity.lead.sourceInquiry && {
          sourceInquiry: opportunity.lead.sourceInquiry,
        }),
      },
    }),
  };
}
