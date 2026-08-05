"use client";

import type { ApiResponse, CreateContactInput, CreateQuotationRequestInput } from "@ppn/shared-types";
import { ApiRequestError } from "./api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export interface SubmitResult {
  id: string;
  status: string;
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

export { ApiRequestError };
