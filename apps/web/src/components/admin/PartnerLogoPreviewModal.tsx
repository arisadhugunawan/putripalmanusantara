"use client";

import type { PartnerLogo } from "@ppn/shared-types";
import { Modal } from "@ppn/ui-components";
import Image from "next/image";

/** Large natural-color preview of a partner logo before publishing — same "never recolor
 * an official logo" rule as the Homepage marquee itself (PartnerLogoTile.tsx). Built on the
 * shared `Modal` primitive (Phase 5B) — this previously had no `role="dialog"`/Escape/focus
 * handling of its own; migrating it onto Modal closes that gap as a side effect. */
export function PartnerLogoPreviewModal({ logo, onClose }: { logo: PartnerLogo; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="Preview Logo" maxWidth="lg">
      <div className="flex h-40 w-full items-center justify-center rounded-field border border-neutral-200 bg-white p-6">
        <div className="relative h-full w-full">
          <Image src={logo.logo.file_url} alt={logo.alt_text || logo.partner_name} fill sizes="480px" className="object-contain" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-h3 text-neutral-900">{logo.partner_name}</p>
        <p className="mt-1 text-small font-medium uppercase tracking-wide text-primary-700">{logo.category}</p>
        {logo.description && <p className="mt-2 text-body text-neutral-600">{logo.description}</p>}
        {logo.website_url && (
          <a
            href={logo.website_url}
            target={logo.open_in_new_tab ? "_blank" : undefined}
            rel={logo.open_in_new_tab ? "noopener noreferrer" : undefined}
            className="mt-3 inline-block text-small text-primary-700 underline"
          >
            {logo.website_url}
          </a>
        )}
        <p className="mt-4 text-small text-neutral-500">
          {logo.enabled ? "Aktif" : "Nonaktif"} · {logo.featured ? "Featured: tampil di marquee beranda" : "Featured: tidak tampil di beranda"}
        </p>
      </div>
    </Modal>
  );
}
