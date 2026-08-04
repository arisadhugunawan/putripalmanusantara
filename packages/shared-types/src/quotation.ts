export type QuotationRequestType = "quotation" | "general_contact";
export type QuotationRequestStatus = "new" | "in_progress" | "done";

/** POST /quotation-requests body */
export interface CreateQuotationRequestInput {
  name: string;
  company: string;
  country: string;
  email: string;
  phone?: string;
  product_id?: string;
  estimated_quantity?: string;
  message: string;
  source_page: string;
  /** Honeypot field — must stay empty; presence of a value flags the submission as spam. */
  website?: string;
}

/** POST /contact body */
export interface CreateContactInput {
  name: string;
  company: string;
  country: string;
  email: string;
  message: string;
  source_page: string;
  website?: string;
}

export interface QuotationRequest {
  id: string;
  type: QuotationRequestType;
  name: string;
  company: string;
  country: string;
  email: string;
  phone: string | null;
  product_id: string | null;
  product_name: string | null;
  estimated_quantity: string | null;
  message: string;
  status: QuotationRequestStatus;
  source_page: string;
  created_at: string;
}
