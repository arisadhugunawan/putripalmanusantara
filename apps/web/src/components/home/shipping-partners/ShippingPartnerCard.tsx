"use client";

import type { ShippingPartner } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";

/**
 * One shipping/logistics partner logo inside the Global Shipping Partner carousel — large
 * premium card, always the partner's own original colors (no grayscale/sepia/tint/opacity
 * reduction, per the brief: official carrier logos must never be recolored). Falls back to
 * the partner's name as plain text if the image fails to load, so one broken upload never
 * breaks the carousel.
 */
export function ShippingPartnerCard({
  partner,
  showName,
  showRelationshipType,
  dictionary,
}: {
  partner: ShippingPartner;
  showName: boolean;
  showRelationshipType: boolean;
  dictionary: Dictionary;
}) {
  const [broken, setBroken] = useState(false);
  const altText = partner.alt_text || partner.partner_name;
  const relationshipLabel = dictionary.shippingPartner.relationshipTypes[partner.relationship_type];

  const card = (
    <div
      className={cn(
        "flex h-24 w-52 shrink-0 items-center justify-center rounded-[20px] border border-neutral-200 bg-white p-6 shadow-[0_1px_3px_rgba(31,36,33,0.04)] transition-all duration-300 sm:h-28 sm:w-56 sm:p-8 md:h-36 md:w-72 md:p-10",
        "group-hover/ship:scale-[1.02] group-hover/ship:border-primary-300 group-hover/ship:shadow-[0_6px_16px_rgba(31,36,33,0.1)]",
      )}
    >
      {broken ? (
        <span className="text-center text-small font-medium text-neutral-500">{partner.partner_name}</span>
      ) : (
        <div className="relative h-full w-full">
          <Image
            src={partner.logo.file_url}
            alt={altText}
            fill
            sizes="288px"
            style={{ filter: "none", opacity: 1, mixBlendMode: "normal" }}
            className="object-contain"
            onError={() => setBroken(true)}
          />
        </div>
      )}
    </div>
  );

  const inner = partner.website_url ? (
    <a
      href={partner.website_url}
      target={partner.open_in_new_tab ? "_blank" : undefined}
      rel={partner.open_in_new_tab ? "noopener noreferrer" : undefined}
      aria-label={partner.partner_name}
      className="rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      {card}
    </a>
  ) : (
    card
  );

  return (
    <div className="group/ship flex shrink-0 flex-col items-center gap-2">
      {inner}
      {(showName || showRelationshipType) && (
        <div className="text-center">
          {showName && <p className="text-body font-medium text-neutral-900">{partner.partner_name}</p>}
          {showRelationshipType && <p className="text-small text-neutral-500">{relationshipLabel}</p>}
        </div>
      )}
    </div>
  );
}
