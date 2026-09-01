"use client";

import type { ShipmentContainerType } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";

const BASE_WIDTH_PX = 120;
const WIDTH_STEP_PX = 44;

/** Interactive container-size toggle at the route visual's "Container" node. The container
 * outline (reused from `DecorativeSvgs.tsx`'s `container_outline`) morphs width via CSS
 * transition to suggest relative length, and idles with a slow float+slight-rotate — the
 * brief's permitted CSS-transform fallback for a "3D container" (no 3D library). */
export function ShipmentContainerToggle({
  types,
  sizeAriaLabel = "Container size",
  suffixTemplate = "{label} Container",
}: {
  types: ShipmentContainerType[];
  sizeAriaLabel?: string;
  /** Must contain the literal "{label}" placeholder. */
  suffixTemplate?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const ContainerOutline = DECORATIVE_SVGS.container_outline;

  if (types.length === 0) return null;

  const active = types[Math.min(activeIndex, types.length - 1)];
  const width = BASE_WIDTH_PX + activeIndex * WIDTH_STEP_PX;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-24 items-center justify-center overflow-hidden">
        <div
          className={cn(
            "text-primary-600 transition-[width] duration-300 ease-out",
            !reducedMotion && "animate-[shipment-container-float_6s_ease-in-out_infinite]",
          )}
          style={{ width: `${width}px` }}
        >
          <ContainerOutline className="h-auto w-full" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={sizeAriaLabel}>
        {types.map((type, index) => (
          <button
            key={type.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-small font-medium transition-colors",
              index === activeIndex
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-primary-300",
            )}
          >
            {type.label}
          </button>
        ))}
      </div>
      <p className="text-small text-neutral-500">{suffixTemplate.replace("{label}", active.label)}</p>
    </div>
  );
}
