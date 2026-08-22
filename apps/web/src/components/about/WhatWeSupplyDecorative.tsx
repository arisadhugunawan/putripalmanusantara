import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";

const LeafOutline = DECORATIVE_SVGS.leaf_outline;
const PalmLeaf = DECORATIVE_SVGS.palm_leaf;

/**
 * Subtle background layer for "What We Supply" — dotted grid + two soft blurred glows (same
 * technique `SupplyNetworkSection.tsx` uses on the Homepage, ported to the PPN hex palette this
 * About Company redesign uses rather than the site's global `primary-*`/`accent-*` tokens) plus
 * the project's existing hand-authored leaf SVGs (`DecorativeSvgs.tsx`, reused — not a new
 * asset). Everything here is `aria-hidden`, low-opacity (3–8%), and `transform`-only so it never
 * competes with the product carousel or triggers layout shift.
 */
export function WhatWeSupplyDecorative() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_30%,black_35%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(36,92,58,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <span className="animate-article-float-slow absolute -right-24 top-10 h-80 w-80 rounded-full bg-[#6FAF3A]/10 blur-3xl" />
      <span className="animate-article-float absolute -left-20 bottom-0 h-96 w-96 rounded-full bg-[#A8D85A]/10 blur-3xl" />
      <LeafOutline className="animate-article-float absolute -left-10 top-0 h-56 w-56 text-[#245C3A]/[0.04] sm:h-72 sm:w-72" />
      <PalmLeaf className="animate-article-float-slow absolute -right-8 bottom-0 h-52 w-52 text-[#6FAF3A]/[0.05] sm:h-64 sm:w-64" />
    </div>
  );
}
