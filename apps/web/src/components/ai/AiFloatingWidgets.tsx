"use client";

import type { AiQuickQuestion, PublicAiSettings } from "@ppn/shared-types";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@ppn/ui-components";
import { generateWhatsAppMessage, getAiQuickQuestions, getAiSettings, recordAiAnalyticsEvent } from "@/lib/api-client";
import { AiChatWindow } from "./AiChatWindow";
import { useAiChat } from "./useAiChat";
import { ChatBubbleIcon, CloseIcon, SparkleIcon } from "./AiIcons";
import { WhatsAppIcon } from "@/components/contact/icons";

const PRODUCT_PATH_PATTERN = /\/products\/([^/?#]+)/;

function extractProductSlug(pathname: string): string | null {
  const match = pathname.match(PRODUCT_PATH_PATTERN);
  return match ? match[1] : null;
}

/**
 * Global floating widget pair (brief §J: AI Assistant above WhatsApp, bottom-right) — mounted
 * once in `[locale]/layout.tsx` so it's available on every public page, including `/contact`.
 * The Contact page previously had its OWN, desktop-only, non-product-aware WhatsApp floating
 * button (`components/contact/WhatsAppFloatingButton.tsx`); that usage was removed in favor of
 * this global one so there's exactly one floating WhatsApp affordance site-wide, not two. On
 * `/contact` specifically, the WhatsApp bubble still hides on mobile — `MobileContactBar`
 * already gives that page its own full-width mobile contact bar, and stacking a second floating
 * WhatsApp control on top of it would be redundant, not helpful.
 *
 * Both widgets fetch their own settings client-side after mount (brief §AC "lazy loaded... not
 * blocking page rendering") rather than being fed through the server-rendered layout.
 */
export function AiFloatingWidgets({ locale, logoUrl }: { locale: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const productSlug = extractProductSlug(pathname);
  const isContactPage = pathname.includes("/contact");

  const [aiSettings, setAiSettings] = useState<PublicAiSettings | null>(null);
  const [quickQuestions, setQuickQuestions] = useState<AiQuickQuestion[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const pageContext = { path: pathname, product_slug: productSlug };
  const chat = useAiChat({ language: locale, pageContext });

  // AbortController cleanup so React Strict Mode's dev-only double-invoke (mount → cleanup →
  // mount) cancels the first in-flight request instead of letting both land — without this,
  // every page load fired two complete settings/quick-questions round trips.
  useEffect(() => {
    const controller = new AbortController();
    void getAiSettings(controller.signal)
      .then(setAiSettings)
      .catch(() => {
        if (!controller.signal.aborted) setAiSettings(null);
      });
    void getAiQuickQuestions(locale, controller.signal)
      .then(setQuickQuestions)
      .catch(() => {
        if (!controller.signal.aborted) setQuickQuestions([]);
      });
    return () => controller.abort();
  }, [locale]);

  // The WhatsApp link is only resolved once the visitor shows real intent to use it (hovering/
  // focusing the floating button, or opening the chat) — never eagerly on page load, so a page
  // view alone no longer triggers this request at all.
  useEffect(() => {
    if (!whatsappReady) return;
    const controller = new AbortController();
    void generateWhatsAppMessage(productSlug, locale, controller.signal)
      .then((res) => setWhatsappUrl(res.url))
      .catch(() => undefined);
    return () => controller.abort();
  }, [whatsappReady, productSlug, locale]);

  const prepareWhatsApp = useCallback(() => setWhatsappReady(true), []);

  // On touch devices, `onTouchStart` and the click land close enough together that
  // `whatsappUrl` usually hasn't resolved yet, so without this the anchor's `href="#"`
  // fallback wins the first tap and opens a dead blank tab instead of WhatsApp — a second tap
  // is then required. Deferring the actual `window.open` until the URL resolves fixes the
  // first tap without changing the lazy-fetch strategy above.
  const pendingWhatsAppOpenRef = useRef(false);
  useEffect(() => {
    if (whatsappUrl && pendingWhatsAppOpenRef.current) {
      pendingWhatsAppOpenRef.current = false;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }, [whatsappUrl]);

  const handleWhatsAppClick = useCallback(() => {
    if (!whatsappUrl) {
      pendingWhatsAppOpenRef.current = true;
      prepareWhatsApp();
    }
  }, [whatsappUrl, prepareWhatsApp]);

  const openChat = useCallback(() => {
    setChatOpen(true);
    setWhatsappReady(true);
    if (!hasOpenedOnce && chat.sessionId) {
      setHasOpenedOnce(true);
      void recordAiAnalyticsEvent("chat_opened", chat.sessionId, locale).catch(() => undefined);
    }
  }, [hasOpenedOnce, chat.sessionId, locale]);

  if (!aiSettings) return null;

  const showAiButton = aiSettings.enabled;
  const aiVisibilityClass = cn(
    !aiSettings.desktop_enabled && "sm:hidden",
    !aiSettings.mobile_enabled && "hidden sm:flex",
  );
  const whatsappVisibilityClass = cn(isContactPage && "hidden sm:flex");

  return (
    <>
      {chatOpen && showAiButton && (
        <div className="fixed inset-x-4 bottom-4 z-40 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-24">
          <AiChatWindow
            settings={aiSettings}
            quickQuestions={quickQuestions}
            messages={chat.messages}
            sending={chat.sending}
            language={locale}
            logoUrl={logoUrl}
            whatsappUrl={whatsappUrl}
            sessionId={chat.sessionId}
            onSend={(text) => void chat.send(text)}
            onMinimize={() => setChatOpen(false)}
            onClose={() => setChatOpen(false)}
          />
        </div>
      )}

      <div
        className={cn(
          "fixed right-4 bottom-4 z-40 flex-col items-end gap-3 sm:right-6 sm:bottom-6 sm:flex",
          chatOpen ? "hidden" : "flex",
        )}
      >
        {showAiButton && (
          <button
            type="button"
            onClick={() => (chatOpen ? setChatOpen(false) : openChat())}
            aria-label={chatOpen ? "Close PPN Assistant" : "Open PPN Assistant"}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full bg-(--color-footer) text-white shadow-[0_12px_30px_-8px_rgba(15,42,28,0.5)] transition-transform duration-200 hover:scale-105 motion-reduce:transition-none",
              aiVisibilityClass,
            )}
          >
            {chatOpen ? <CloseIcon className="h-6 w-6" /> : <ChatBubbleIconWithSpark />}
          </button>
        )}

        {aiSettings.whatsapp_enabled && (
          <a
            href={whatsappUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with PPN Team on WhatsApp"
            onMouseEnter={prepareWhatsApp}
            onFocus={prepareWhatsApp}
            onTouchStart={prepareWhatsApp}
            onClick={(event) => {
              if (!whatsappUrl) event.preventDefault();
              handleWhatsAppClick();
              void recordAiAnalyticsEvent("whatsapp_clicked", chat.sessionId || "anon", locale).catch(() => undefined);
            }}
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full bg-[#A8D85A] text-[#183D2B] shadow-[0_12px_30px_-8px_rgba(24,61,43,0.45)] transition-transform duration-200 hover:scale-105 motion-reduce:transition-none",
              whatsappVisibilityClass,
            )}
          >
            <span
              className="absolute inset-2.5 rounded-full bg-[#6FAF3A] motion-safe:[animation:whatsapp-fab-pulse-ring_2.4s_ease-out_infinite]"
              aria-hidden="true"
            />
            <WhatsAppIcon size={26} />
          </a>
        )}
      </div>
    </>
  );
}

function ChatBubbleIconWithSpark() {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <ChatBubbleIcon className="h-6 w-6" />
      <SparkleIcon className="absolute -right-1.5 -top-1.5 h-3 w-3 text-primary-400" />
    </span>
  );
}
