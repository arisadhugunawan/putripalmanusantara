import type { ProductDownload } from "@ppn/shared-types";
import { whatsAppLink } from "@/lib/whatsapp";

/**
 * Section 3 "Quick Action" — the two primary buyer actions sit side by side and full width so
 * they read as the page's main call to action: **Catalogue** (only when the CMS actually holds
 * a file for this product) and **WhatsApp**, pre-filled with the product name.
 *
 * Each button only renders when its data exists, so a product without a catalogue file shows
 * one wide WhatsApp button rather than a dead control.
 */
export function ProductQuickActions({
  productName,
  downloads,
  whatsappNumber,
  catalogueLabel = "Catalogue",
  whatsappLabel = "WhatsApp",
  whatsappMessageTemplate = "Hi, I'm interested in {product}. Could you share more details?",
}: {
  productName: string;
  downloads: ProductDownload[];
  whatsappNumber: string | undefined;
  catalogueLabel?: string;
  whatsappLabel?: string;
  /** Must contain the literal "{product}" placeholder. */
  whatsappMessageTemplate?: string;
}) {
  const primaryDownload = downloads[0];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {primaryDownload && (
        <a
          href={primaryDownload.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-button bg-catalogue-500 px-6 py-3.5 text-body font-semibold text-neutral-900 shadow-[0_10px_24px_-10px_rgba(217,143,22,0.65)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-catalogue-600 hover:shadow-[0_14px_30px_-10px_rgba(217,143,22,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-catalogue-600"
        >
          {catalogueLabel}
          <DownloadIcon />
        </a>
      )}
      {whatsappNumber && (
        <a
          href={whatsAppLink(whatsappNumber, whatsappMessageTemplate.replace("{product}", productName))}
          target="_blank"
          rel="noopener noreferrer"
          // WhatsApp green is the platform's own brand colour, used only on this button so
          // the action is instantly recognisable; the rest of the page stays on PPN's palette.
          className="inline-flex items-center justify-center gap-2 rounded-button bg-[#1FA855] px-6 py-3.5 text-body font-medium text-white transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#1a8f48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a8f48]"
        >
          {whatsappLabel}
          <WhatsAppIcon />
        </a>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="transition-transform duration-200 ease-out group-hover:translate-y-0.5"
    >
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3c-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6a9.3 9.3 0 0 0 3.6 3.2c1.7.7 1.9.6 2.3.5.4 0 1.4-.5 1.6-1.1.2-.6.2-1 .1-1.1Z" />
    </svg>
  );
}
