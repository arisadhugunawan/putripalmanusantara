"use client";

import type { AiChatMessage, AiChatSource } from "@ppn/shared-types";
import { useEffect, useRef, useState } from "react";
import { sendAiChatMessage } from "@/lib/api-client";
import { ApiRequestError } from "@/lib/api-error";

const SESSION_STORAGE_KEY = "ppn_ai_session_id";

/** Ephemeral per-browser-session id (brief §P/§AA) — regenerated every new tab/session, never
 * tied to an account or any persistent visitor identifier. `sessionStorage` (not `localStorage`)
 * is deliberate: it should not outlive the tab. */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AiChatSource[];
  quotationIntent?: boolean;
}

const FALLBACK_UNAVAILABLE: Record<string, string> = {
  en: "Sorry, our assistant is temporarily unavailable. Please contact the PPN team through WhatsApp.",
  id: "Maaf, asisten kami sedang tidak tersedia. Silakan hubungi tim PPN melalui WhatsApp.",
};

export function useAiChat(params: {
  language: string;
  pageContext: { path: string; product_slug?: string | null };
}) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const nextId = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser-only storage API; cannot run during SSR/render
    setSessionId(getOrCreateSessionId());
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMessage: DisplayMessage = { id: `local-${nextId.current++}`, role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    const history: AiChatMessage[] = [...messages, userMessage]
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await sendAiChatMessage({
        session_id: sessionId,
        message: trimmed,
        language: params.language,
        history,
        page_context: params.pageContext,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${nextId.current++}`,
          role: "assistant",
          content: response.reply,
          sources: response.sources,
          quotationIntent: response.quotation_intent,
        },
      ]);
    } catch (err) {
      const fallback =
        err instanceof ApiRequestError
          ? err.message
          : (FALLBACK_UNAVAILABLE[params.language] ?? FALLBACK_UNAVAILABLE.en);
      setMessages((prev) => [...prev, { id: `local-${nextId.current++}`, role: "assistant", content: fallback }]);
    } finally {
      setSending(false);
    }
  }

  return { sessionId, messages, sending, send };
}
