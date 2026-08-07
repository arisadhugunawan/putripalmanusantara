import type { ProductDownload } from "@ppn/shared-types";
import { buttonVariants, cn } from "@ppn/ui-components";
import { whatsAppLink } from "@/lib/whatsapp";

/** Section 3 "Quick Action" — Catalogue Download (only shown if the CMS has a PDF for this
 * product), WhatsApp Inquiry (pre-filled with the product name), Request Quotation
 * (scrolls to the form already on this page — see #quotation). */
export function ProductQuickActions({
  productName,
  downloads,
  whatsappNumber,
}: {
  productName: string;
  downloads: ProductDownload[];
  whatsappNumber: string | undefined;
}) {
  const primaryDownload = downloads[0];

  return (
    <div className="flex flex-wrap gap-3">
      {primaryDownload && (
        <a
          href={primaryDownload.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants("secondary", "md")}
        >
          Download Catalogue
        </a>
      )}
      {whatsappNumber && (
        <a
          href={whatsAppLink(whatsappNumber, `Hi, I'm interested in ${productName}. Could you share more details?`)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants("secondary", "md"))}
        >
          WhatsApp Inquiry
        </a>
      )}
      <a href="#quotation" className={buttonVariants("primary", "md")}>
        Request Quotation
      </a>
    </div>
  );
}
