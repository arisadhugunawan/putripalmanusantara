export const AI_SOURCE_KEYS = [
  "home",
  "about_company",
  "products",
  "facilities",
  "moq_payment_terms",
  "shipment_terms",
  "faq",
  "gallery",
  "news",
  "contact",
  "legal_certificates",
] as const;
export type AiSourceKey = (typeof AI_SOURCE_KEYS)[number];

/** Admin view of the AI Assistant's singleton settings (Admin → AI Assistant → General /
 * Knowledge / WhatsApp). */
export interface AiSettings {
  id: string;
  enabled: boolean;
  assistant_name: string;
  subtitle: string;
  desktop_enabled: boolean;
  mobile_enabled: boolean;
  business_instructions: string;
  include_home: boolean;
  include_about_company: boolean;
  include_products: boolean;
  include_facilities: boolean;
  include_moq_payment_terms: boolean;
  include_shipment_terms: boolean;
  include_faq: boolean;
  include_gallery: boolean;
  include_news: boolean;
  include_contact: boolean;
  include_legal_certificates: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_display_name: string;
  whatsapp_general_message: string;
  whatsapp_product_message: string;
  updated_at: string;
}

/** Public view — only what the floating widget needs to render itself; never exposes
 * `business_instructions` or the `include_*` knowledge toggles (internal retrieval config). */
export interface PublicAiSettings {
  enabled: boolean;
  assistant_name: string;
  subtitle: string;
  desktop_enabled: boolean;
  mobile_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_display_name: string;
  whatsapp_general_message: string;
  whatsapp_product_message: string;
}

export type AiSyncRunStatus = "running" | "success" | "failed";

export interface AiSyncStatus {
  active_version: string | null;
  last_synced_at: string | null;
  last_status: AiSyncRunStatus;
  last_error: string | null;
  total_sources: number;
  indexed_count: number;
  failed_count: number;
  updated_at: string;
  /** True while publish-triggered automatic sync is temporarily suppressed after repeated
   * consecutive failures — the 5-minute cron and manual Sync Now still work. Clears on the next
   * successful sync. */
  auto_sync_suppressed: boolean;
}

export interface AiSyncLog {
  id: string;
  version: string;
  status: AiSyncRunStatus;
  trigger: string;
  started_at: string;
  finished_at: string | null;
  chunks_created: number;
  error_message: string | null;
}

export interface AiKnowledgeSourceSummary {
  source_key: AiSourceKey;
  label: string;
  enabled: boolean;
  chunk_count: number;
}

export interface AiQuickQuestion {
  id: string;
  label: string;
  question: string;
  language: string;
  active: boolean;
  order: number;
  updated_at: string;
}

export type AiMessageRole = "user" | "assistant";

export interface AiChatMessage {
  role: AiMessageRole;
  content: string;
}

export interface AiChatSource {
  label: string;
  url: string;
}

export interface AiChatPageContext {
  path: string;
  product_slug?: string | null;
}

export interface AiChatRequest {
  session_id: string;
  message: string;
  language: string;
  history: AiChatMessage[];
  page_context?: AiChatPageContext;
}

export interface AiChatResponse {
  reply: string;
  sources: AiChatSource[];
  quotation_intent: boolean;
}

export interface AiTestQueryResult {
  answer: string;
  sources: AiChatSource[];
  language: string;
  knowledge_version: string | null;
}

export const AI_ANALYTICS_EVENT_TYPES = [
  "chat_opened",
  "question_submitted",
  "quick_question_clicked",
  "quotation_intent",
  "whatsapp_clicked",
] as const;
export type AiAnalyticsEventType = (typeof AI_ANALYTICS_EVENT_TYPES)[number];

export interface AiAnalyticsSummary {
  assistant_active: boolean;
  knowledge_sources: number;
  indexed_content: number;
  last_sync: string | null;
  failed_sync: number;
  total_conversations: number;
  whatsapp_clicks: number;
  quotation_intent: number;
}
