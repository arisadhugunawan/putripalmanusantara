"use client";

import type { AiQuickQuestion, PublicAiSettings } from "@ppn/shared-types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { recordAiAnalyticsEvent } from "@/lib/api-client";
import type { DisplayMessage } from "./useAiChat";
import { ArrowRightIcon, CloseIcon, MinimizeIcon, SendIcon, SparkleIcon } from "./AiIcons";
import { WhatsAppIcon } from "@/components/contact/icons";

const WELCOME_TEXT: Record<string, string> = {
  en: "Hello! 👋 I'm the PPN Assistant. I can help you with our coconut products, specifications, shipment, MOQ, facilities, and company information.",
  id: "Halo! 👋 Saya PPN Assistant. Saya bisa membantu Anda seputar produk kelapa kami, spesifikasi, pengiriman, MOQ, fasilitas, dan informasi perusahaan.",
  zh: "您好！👋 我是 PPN 助手。我可以帮助您了解我们的椰子产品、规格、运输、最小起订量、设施和公司信息。",
  th: "สวัสดี! 👋 ฉันคือ PPN Assistant ฉันสามารถช่วยคุณเกี่ยวกับผลิตภัณฑ์มะพร้าว ข้อมูลจำเพาะ การจัดส่ง MOQ สิ่งอำนวยความสะดวก และข้อมูลบริษัทของเรา",
  hi: "नमस्ते! 👋 मैं PPN Assistant हूँ। मैं आपके हमारे नारियल उत्पादों, विशिष्टताओं, शिपमेंट, MOQ, सुविधाओं और कंपनी की जानकारी में मदद कर सकता हूँ।",
  vi: "Xin chào! 👋 Tôi là PPN Assistant. Tôi có thể giúp bạn về các sản phẩm dừa, thông số kỹ thuật, vận chuyển, MOQ, cơ sở vật chất và thông tin công ty của chúng tôi.",
};

const PLACEHOLDER_TEXT: Record<string, string> = {
  en: "Ask about our products, shipment, MOQ...",
  id: "Tanyakan produk, pengiriman, MOQ kami...",
  zh: "询问我们的产品、运输、最小起订量……",
  th: "สอบถามเกี่ยวกับผลิตภัณฑ์ การจัดส่ง MOQ ของเรา...",
  hi: "हमारे उत्पादों, शिपमेंट, MOQ के बारे में पूछें...",
  vi: "Hỏi về sản phẩm, vận chuyển, MOQ của chúng tôi...",
};

const TYPING_TEXT: Record<string, string> = {
  en: "PPN Assistant is typing...",
  id: "PPN Assistant sedang mengetik...",
  zh: "PPN 助手正在输入……",
  th: "PPN Assistant กำลังพิมพ์...",
  hi: "PPN Assistant टाइप कर रहा है...",
  vi: "PPN Assistant đang nhập...",
};

const WHATSAPP_CONTINUE_TEXT: Record<string, string> = {
  en: "Continue on WhatsApp",
  id: "Lanjutkan di WhatsApp",
  zh: "在 WhatsApp 上继续",
  th: "ดำเนินการต่อทาง WhatsApp",
  hi: "WhatsApp पर जारी रखें",
  vi: "Tiếp tục trên WhatsApp",
};

const MINIMIZE_LABEL: Record<string, string> = {
  en: "Minimize",
  id: "Perkecil",
  zh: "最小化",
  th: "ย่อเล็กสุด",
  hi: "छोटा करें",
  vi: "Thu nhỏ",
};

const CLOSE_LABEL: Record<string, string> = {
  en: "Close",
  id: "Tutup",
  zh: "关闭",
  th: "ปิด",
  hi: "बंद करें",
  vi: "Đóng",
};

const SEND_LABEL: Record<string, string> = {
  en: "Send",
  id: "Kirim",
  zh: "发送",
  th: "ส่ง",
  hi: "भेजें",
  vi: "Gửi",
};

function t(dict: Record<string, string>, language: string) {
  return dict[language] ?? dict.en;
}

export function AiChatWindow({
  settings,
  quickQuestions,
  messages,
  sending,
  language,
  logoUrl,
  whatsappUrl,
  sessionId,
  onSend,
  onMinimize,
  onClose,
}: {
  settings: PublicAiSettings;
  quickQuestions: AiQuickQuestion[];
  messages: DisplayMessage[];
  sending: boolean;
  language: string;
  logoUrl: string | null;
  whatsappUrl: string;
  sessionId: string;
  onSend: (text: string) => void;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Moves focus into the dialog on open and hands it back to whatever opened it on close, so
  // keyboard users aren't dropped at the top of the page behind the widget (matches ConfirmDialog.tsx).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  }

  function handleQuickQuestion(q: AiQuickQuestion) {
    void recordAiAnalyticsEvent("quick_question_clicked", sessionId, language).catch(() => undefined);
    onSend(q.question);
  }

  const showQuickQuestions = messages.length === 0 && quickQuestions.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={settings.assistant_name}
      className="flex h-[min(680px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-neutral-200 bg-white shadow-[0_30px_70px_-20px_rgba(15,42,28,0.35)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-(--color-footer) px-5 py-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20">
              <Image src={logoUrl} alt="" fill sizes="36px" className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
              <SparkleIcon className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-body font-semibold text-white">
              {settings.assistant_name}
              <span className="h-2 w-2 rounded-full bg-primary-400" aria-hidden="true" title="Online" />
            </p>
            <p className="text-[11px] text-neutral-300">{settings.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            aria-label={t(MINIMIZE_LABEL, language)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MinimizeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(CLOSE_LABEL, language)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-4">
        <div className="rounded-field bg-white p-3 text-small text-neutral-700 shadow-[var(--shadow-card)]">
          {t(WELCOME_TEXT, language)}
        </div>

        {showQuickQuestions && (
          <div className="mt-3 flex flex-col gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => handleQuickQuestion(q)}
                className="flex items-center justify-between gap-2 rounded-field border border-neutral-200 bg-white px-3.5 py-2.5 text-left text-small font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[var(--shadow-card)]"
              >
                {q.label}
                <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-primary-600" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-[16px_16px_4px_16px] bg-primary-500 px-3.5 py-2.5 text-small text-neutral-900"
                    : "max-w-[85%] rounded-[16px_16px_16px_4px] bg-white px-3.5 py-2.5 text-small text-neutral-800 shadow-[var(--shadow-card)]"
                }
              >
                <p className="whitespace-pre-line">{m.content}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-neutral-100 pt-2">
                    {m.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        className="text-[11px] font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                      >
                        {s.label} →
                      </a>
                    ))}
                  </div>
                )}
                {m.quotationIntent && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => void recordAiAnalyticsEvent("whatsapp_clicked", sessionId, language).catch(() => undefined)}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-button bg-primary-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    <WhatsAppIcon size={14} />
                    {t(WHATSAPP_CONTINUE_TEXT, language)}
                  </a>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-[16px_16px_16px_4px] bg-white px-3.5 py-2.5 shadow-[var(--shadow-card)]">
                <span className="text-[11px] text-neutral-500">{t(TYPING_TEXT, language)}</span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(PLACEHOLDER_TEXT, language)}
          maxLength={1000}
          className="flex-1 rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-small text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label={t(SEND_LABEL, language)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-900 transition-colors hover:bg-primary-600 disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
