"use client";

import type { PartnerLogo } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useState } from "react";

/**
 * One logo inside the Trusted Institutions & Partners marquee — a consistent card
 * container (white background, subtle border, generous padding) always shown in the
 * institution's own original colors (no grayscale/sepia/tint — official logos must never
 * be recolored). Hover adds a slight scale + soft green border, never a color change.
 * Falls back to the partner's name as plain text if the image fails to load, so one broken
 * upload never breaks the carousel.
 */
export function PartnerLogoTile({ logo }: { logo: PartnerLogo }) {
  const [broken, setBroken] = useState(false);
  const altText = logo.alt_text || logo.partner_name;

  const card = (
    <div
      className={cn(
        "flex h-16 w-32 shrink-0 items-center justify-center rounded-field border border-neutral-200 bg-white px-5 py-3 shadow-[0_1px_3px_rgba(31,36,33,0.04)] transition-all duration-300 sm:h-20 sm:w-44 md:h-24 md:w-56",
        "group-hover/tile:scale-[1.03] group-hover/tile:border-primary-300 group-hover/tile:shadow-[0_4px_12px_rgba(31,36,33,0.08)]",
      )}
    >
      {broken ? (
        <span className="text-center text-small font-medium text-neutral-500">{logo.partner_name}</span>
      ) : (
        <div className="relative h-full w-full">
          <Image
            src={logo.logo.file_url}
            alt={altText}
            fill
            sizes="224px"
            className="object-contain"
            onError={() => setBroken(true)}
          />
        </div>
      )}
    </div>
  );

  if (logo.website_url) {
    return (
      <a
        href={logo.website_url}
        target={logo.open_in_new_tab ? "_blank" : undefined}
        rel={logo.open_in_new_tab ? "noopener noreferrer" : undefined}
        aria-label={logo.description ? `${logo.partner_name} — ${logo.description}` : logo.partner_name}
        className="group/tile shrink-0 rounded-field focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        {card}
      </a>
    );
  }

  return (
    <div className="group/tile shrink-0" aria-label={logo.partner_name}>
      {card}
    </div>
  );
}
