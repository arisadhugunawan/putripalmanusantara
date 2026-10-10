import type { InquiryModel as Inquiry } from '../../../generated/prisma/models';

type InquiryWithCompany = Inquiry & {
  company: { id: string; name: string } | null;
};

// Explicit allow-list — mirrors the Admin business-relationship mapper (Phase 17C). Never
// includes the whole QuotationRequest, only the id already on the row.
export interface InquirySummary {
  id: string;
  inquiryNumber: string;
  source: string;
  companyName: string;
  companyId: string | null;
  company: { id: string; name: string } | null;
  contactName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: string;
  sourceQuotationRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toInquiry(inquiry: InquiryWithCompany): InquirySummary {
  return {
    id: inquiry.id,
    inquiryNumber: inquiry.inquiryNumber,
    source: inquiry.source,
    companyName: inquiry.companyName,
    companyId: inquiry.companyId,
    company: inquiry.company,
    contactName: inquiry.contactName,
    email: inquiry.email,
    phone: inquiry.phone,
    subject: inquiry.subject,
    message: inquiry.message,
    status: inquiry.status,
    sourceQuotationRequestId: inquiry.sourceQuotationRequestId,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}
