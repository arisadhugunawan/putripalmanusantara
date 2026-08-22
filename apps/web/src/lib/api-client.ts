"use client";

import type {
  AiChatRequest,
  AiChatResponse,
  AiQuickQuestion,
  ApiResponse,
  CreateContactInput,
  CreateQuotationRequestInput,
  PublicAiSettings,
} from "@ppn/shared-types";
import { ApiRequestError } from "./api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export interface SubmitResult {
  id: string;
  status: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiRequestError(json.error.message, res.status, json.error.code);
  }
  return json.data;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiRequestError(json.error.message, res.status, json.error.code);
  }
  return json.data;
}

export function submitQuotationRequest(input: CreateQuotationRequestInput) {
  return post<SubmitResult>("/quotation-requests", input);
}

export function submitContact(input: CreateContactInput) {
  return post<SubmitResult>("/contact", input);
}

// --- PPN AI Assistant + Floating WhatsApp Button ---

export function getAiSettings() {
  return get<PublicAiSettings>("/ai/settings");
}

export function getAiQuickQuestions(language: string) {
  return get<AiQuickQuestion[]>(`/ai/quick-questions?language=${encodeURIComponent(language)}`);
}

export function sendAiChatMessage(request: AiChatRequest) {
  return post<AiChatResponse>("/ai/chat", request);
}

export function recordAiAnalyticsEvent(
  eventType: "chat_opened" | "quick_question_clicked" | "whatsapp_clicked",
  sessionId: string,
  language?: string,
  productId?: string,
) {
  // Fire-and-forget by callers — analytics must never block or break the UI it's measuring.
  return post<{ recorded: boolean }>("/ai/analytics/event", {
    event_type: eventType,
    session_id: sessionId,
    language,
    product_id: productId,
  });
}

export function generateWhatsAppMessage(productSlug?: string | null, language?: string) {
  return post<{ whatsapp_number: string; display_name: string; message: string; url: string; enabled: boolean }>(
    "/ai/whatsapp/generate",
    { product_slug: productSlug, language },
  );
}

export { ApiRequestError };
