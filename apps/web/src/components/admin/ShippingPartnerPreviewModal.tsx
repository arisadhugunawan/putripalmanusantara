"use client";

import type { ShippingPartner } from "@ppn/shared-types";
import { SHIPPING_RELATIONSHIP_TYPE_LABELS } from "@ppn/shared-types";
import Image from "next/image";

/** Large natural-color preview of a shipping partner logo before publishing — same "never
 * recolor an official logo" rule as the Homepage carousel itself (ShippingPartnerCard.tsx). */
export function ShippingPartnerPreviewModal({ partner, onClose }: { partner: ShippingPartner; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <p className="text-small font-medium text-neutral-900">Preview Shipping Partner</p>
          <button type="button" onClick={onClose} className="text-small text-neutral-600 underline">
            Tutup
          </button>
        </div>

        <div className="overflow-auto p-6">
          <div className="flex h-44 w-full items-center justify-center rounded-[20px] border border-neutral-200 bg-white p-8">
            <div className="relative h-full w-full">
              <Image
                src={partner.logo.file_url}
                alt={partner.alt_text || partner.partner_name}
                fill
                sizes="480px"
                style={{ filter: "none", opacity: 1, mixBlendMode: "normal" }}
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-h3 text-neutral-900">{partner.partner_name}</p>
            <p className="mt-1 text-small font-medium uppercase tracking-wide text-primary-700">
              {SHIPPING_RELATIONSHIP_TYPE_LABELS[partner.relationship_type]}
            </p>
            {partner.description && <p className="mt-2 text-body text-neutral-600">{partner.description}</p>}
            {partner.website_url && (
              <a
                href={partner.website_url}
                target={partner.open_in_new_tab ? "_blank" : undefined}
                rel={partner.open_in_new_tab ? "noopener noreferrer" : undefined}
                className="mt-3 inline-block text-small text-primary-700 underline"
              >
                {partner.website_url}
              </a>
            )}
            <p className="mt-4 text-small text-neutral-500">
              {partner.enabled ? "Aktif" : "Nonaktif"} ·{" "}
              {partner.featured ? "Featured: tampil di carousel beranda" : "Featured: tidak tampil di beranda"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
