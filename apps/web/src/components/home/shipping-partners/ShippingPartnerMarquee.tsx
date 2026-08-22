"use client";

import type { HomepageShippingSection, ShippingPartner } from "@ppn/shared-types";
import { useRef } from "react";
import { ShippingPartnerCard } from "./ShippingPartnerCard";

/**
 * Continuous horizontal logo marquee — same duplicated-track + CSS `translateX` loop as
 * PartnerMarquee.tsx (Trusted Institutions), reused here for architectural consistency
 * rather than pulling in a carousel library for a second, near-identical marquee. Adds one
 * behavior PartnerMarquee doesn't need: pausing on touch (not just mouse hover), since the
 * brief is explicit that autoplay must not fight the user's finger on mobile. Reduced-motion
 * users get a plain horizontally-scrollable strip (native touch/trackpad scroll) instead of
 * the wrapped static grid PartnerMarquee falls back to — the brief asks for a scrollable
 * carousel specifically, not a grid, for this section.
 *
 * Direction is intentionally left→right here (`animate-marquee-reverse`), the opposite of
 * PartnerMarquee's right→left `animate-marquee` — a deliberate visual distinction between the
 * two marquees per the Homepage restructuring brief, not a shared setting.
 */
export function ShippingPartnerMarquee({
  section,
  partners,
}: {
  section: HomepageShippingSection;
  partners: ShippingPartner[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicated once so a 50% translateX loop is seamless regardless of partner count.
  const track = [...partners, ...partners];
  const marqueeStyle = { "--marquee-duration": `${section.marquee_duration_seconds}s` } as React.CSSProperties;

  function pause() {
    trackRef.current?.style.setProperty("animation-play-state", "paused");
  }
  function resume() {
    trackRef.current?.style.removeProperty("animation-play-state");
  }

  return (
    <>
      {/* Reduced motion: native horizontal scroll, original (non-duplicated) list. */}
      <div className="motion-safe:hidden">
        <div className="flex snap-x snap-mandatory items-start gap-6 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
          {partners.map((partner) => (
            <div key={partner.id} className="snap-start">
              <ShippingPartnerCard
                partner={partner}
                showName={section.show_partner_name}
                showRelationshipType={section.show_relationship_type}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Default: animated infinite marquee, pauses on hover (CSS) and on touch (JS). */}
      <div
        className="group relative motion-reduce:hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
      >
        <div
          ref={trackRef}
          style={marqueeStyle}
          className="animate-marquee-reverse flex w-max items-start gap-8 will-change-transform group-hover:[animation-play-state:paused]"
        >
          {track.map((partner, index) => (
            <ShippingPartnerCard
              key={`${partner.id}-${index}`}
              partner={partner}
              showName={section.show_partner_name}
              showRelationshipType={section.show_relationship_type}
            />
          ))}
        </div>
      </div>
    </>
  );
}
