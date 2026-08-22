"use client";

import type { ApiResponse, PaginationMeta } from "@ppn/shared-types";
import { ApiRequestError } from "../api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T; meta: PaginationMeta | null }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      // A plain cross-site <form> submission can never set a custom header (only a fixed,
      // browser-controlled allowlist survives a "simple request"), so its presence proves this
      // request came from this app's own JS — a lightweight CSRF defense layered on top of the
      // auth cookie's own SameSite=Lax, enforced server-side for every /admin/* mutation.
      "X-Requested-With": "XMLHttpRequest",
      ...(options?.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options?.headers,
    },
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiRequestError(json.error.message, res.status, json.error.code, json.error.details);
  }
  return { data: json.data, meta: json.meta };
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path).then((r) => r.data),
  getPaginated: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => r.data),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }).then(
      (r) => r.data,
    ),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }).then((r) => r.data),
};

export { ApiRequestError };
