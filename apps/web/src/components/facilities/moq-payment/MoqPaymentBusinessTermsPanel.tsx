"use client";

import type { MoqPaymentBusinessTerm } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Open-ended list of business terms — deliberately never a `<table>` (per brief) so an
 * arbitrary-length, admin-authored list never forces horizontal scroll on narrow screens.
 * Mobile renders stacked label/value cards; `sm:` and up renders a two-column row layout with
 * a subtle per-row hover shift. */
export function MoqPaymentBusinessTermsPanel({
  terms,
  unavailableText = "Business terms are available upon request.",
}: {
  terms: MoqPaymentBusinessTerm[];
  unavailableText?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (terms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
        <p className="text-body text-neutral-600">{unavailableText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_16px_40px_-28px_rgba(23,23,23,0.25)]">
      {/* Mobile: stacked cards */}
      <div className="flex flex-col divide-y divide-neutral-200 sm:hidden">
        {terms.map((term) => (
          <div key={term.id} className="p-4">
            <p className="text-small font-medium uppercase tracking-wide text-primary-700">{term.label}</p>
            <p className="mt-1 text-body text-neutral-900">{term.value}</p>
          </div>
        ))}
      </div>

      {/* sm+: two-column rows */}
      <div className="hidden divide-y divide-neutral-200 sm:flex sm:flex-col">
        {terms.map((term) => (
          <div
            key={term.id}
            className={cn(
              "grid grid-cols-2 gap-4 px-5 py-4 transition-transform duration-300 ease-out",
              !reducedMotion && "hover:translate-x-1",
            )}
          >
            <p className="text-body font-medium uppercase tracking-wide text-primary-700">{term.label}</p>
            <p className="text-body text-neutral-900">{term.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
