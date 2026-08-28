"use client";

import type { HomepageSupplyNetworkSection, SupplyNetworkItem } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { SupplyNetworkNodeIcon } from "./SupplyNetworkIcons";

/**
 * "Our Supply Network" — the coconut supply journey, redesigned (2026-08) from the previous
 * orbital 3D diagram into a calm, linear sequence: a coconut-shaped icon badge, a step number,
 * a title, and a one-line description per stop, reusing the exact same icon set
 * (`SupplyNetworkIcons.tsx`) and CMS data (`SupplyNetworkItem`) the old diagram read from —
 * only the visual treatment changed, not the content model.
 *
 * Two layouts share the same data: a horizontal grid (tablet/desktop, wraps cleanly at any
 * item count via CSS Grid rather than a fixed-column table) and a vertical, connected journey
 * (mobile) — same "hidden at one breakpoint, shown at the other" convention the previous
 * version already used, just swapped to the sm (640px) boundary instead of lg, since a grid
 * already reads cleanly from tablet width up. `connections`/`countries` (the old radial-diagram
 * link-graph and background country markers) are intentionally not part of this component
 * anymore — the journey's own sequence communicates the same "flow" without them, and
 * `SupplyNetworkSection` above still receives that data unchanged from the page, so nothing
 * about the CMS/API contract was removed.
 */
export function SupplyNetworkVisual({
  section,
  items,
}: {
  section: HomepageSupplyNetworkSection;
  items: SupplyNetworkItem[];
}) {
  if (items.length === 0) return null;

  const hoverOn = section.hover_effect;

  return (
    <>
      {/* Tablet/Desktop — horizontal, wrapping grid. grid-cols-2/3/5 (not a fixed 5-up table)
          so this stays clean whether the admin has 5 stops configured or, as today, 10. */}
      <ol className="hidden grid-cols-2 gap-x-6 gap-y-12 sm:grid md:grid-cols-3 md:gap-x-8 lg:grid-cols-5 lg:gap-x-10 lg:gap-y-16">
        {items.map((item, index) => (
          <FadeUpSection key={item.id} style={{ transitionDelay: `${Math.min(index, 9) * 60}ms` }}>
            <li className="group flex flex-col items-center text-center">
              <StepBadge item={item} hoverOn={hoverOn} />
              <StepNumber index={index} />
              <h3 className="mt-2 text-body-lg font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-1 max-w-[168px] text-small text-neutral-600">{item.description}</p>
            </li>
          </FadeUpSection>
        ))}
      </ol>

      {/* Mobile — vertical journey with a thin connecting line between stops. */}
      <ol className="mx-auto flex max-w-xs flex-col items-center sm:hidden">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-col items-center">
            {index > 0 && <span aria-hidden="true" className="h-8 w-px bg-primary-500/40" />}
            <FadeUpSection style={{ transitionDelay: `${Math.min(index, 9) * 60}ms` }}>
              <div className="group flex flex-col items-center text-center">
                <StepBadge item={item} hoverOn={hoverOn} />
                <StepNumber index={index} />
                <h3 className="mt-2 text-body-lg font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-1 max-w-[240px] text-small text-neutral-600">{item.description}</p>
              </div>
            </FadeUpSection>
          </li>
        ))}
      </ol>
    </>
  );
}

/** Coconut-inspired badge — a round, cross-section-like outline (soft cream fill, thin green
 * ring) holding the step's existing line icon. Not a button: these steps aren't interactive
 * destinations, so this is a plain `span`, matching the "don't make decorative things
 * focusable controls" rule. */
function StepBadge({ item, hoverOn }: { item: SupplyNetworkItem; hoverOn: boolean }) {
  return (
    <span
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary-500/30 bg-neutral-50 text-primary-700 transition-[transform,border-color,background-color] duration-300 ease-out",
        hoverOn && "group-hover:scale-105",
      )}
    >
      <SupplyNetworkNodeIcon icon={item.icon} className="h-7 w-7" />
    </span>
  );
}

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-3 font-heading text-small font-bold tracking-wide text-primary-500">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}
