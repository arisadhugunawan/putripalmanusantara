import type { ContactPageSettings } from "@ppn/shared-types";
import { whatsAppLink } from "@/lib/whatsapp";
import { MailIcon, MapIcon, WhatsAppIcon } from "./icons";

/**
 * Section 26 — sticky bottom contact bar, mobile only (the floating WhatsApp button hides on
 * mobile via its own `hidden sm:flex` so the two never stack). `env(safe-area-inset-bottom)`
 * keeps the bar clear of the home-indicator area on notched phones; `pb-[calc(...)]` on the
 * page's own root wrapper (see `contact/page.tsx`) reserves the same height so this bar never
 * covers the last section's content.
 */
export function MobileContactBar({
  settings,
  whatsappMessage,
  locationsAnchorId,
  labels,
}: {
  settings: ContactPageSettings;
  whatsappMessage: string;
  locationsAnchorId: string;
  labels: { whatsappLabel: string; emailLabel: string; locationLabel: string };
}) {
  return (
    <nav
      aria-label="Quick contact"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white/95 backdrop-blur-sm sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {settings.whatsapp_number && (
        <a
          href={whatsAppLink(settings.whatsapp_number, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[#245C3A] active:bg-[#EEF5E8]"
        >
          <WhatsAppIcon size={20} />
          <span className="text-[11px] font-medium">{labels.whatsappLabel}</span>
        </a>
      )}
      {settings.email && (
        <a
          href={`mailto:${settings.email}`}
          className="flex flex-1 flex-col items-center gap-1 border-x border-neutral-100 py-2.5 text-neutral-700 active:bg-neutral-50"
          aria-label={`${labels.emailLabel}: ${settings.email}`}
        >
          <MailIcon size={20} />
          <span className="text-[11px] font-medium">{labels.emailLabel}</span>
        </a>
      )}
      <a
        href={`#${locationsAnchorId}`}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-neutral-700 active:bg-neutral-50"
        aria-label={labels.locationLabel}
      >
        <MapIcon size={20} />
        <span className="text-[11px] font-medium">{labels.locationLabel}</span>
      </a>
    </nav>
  );
}
