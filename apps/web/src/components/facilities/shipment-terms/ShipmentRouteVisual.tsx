"use client";

import type { ShipmentContainerType, ShipmentLoadingLocation } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";
import { SHIPMENT_ICONS } from "./ShipmentIcons";
import { ShipmentContainerToggle } from "./ShipmentContainerToggle";
import { ShipmentLocationChips } from "./ShipmentLocationChips";

export interface ShipmentRouteLabels {
  loading: string;
  container: string;
  shipment: string;
  destination: string;
}

const DEFAULT_LABELS: ShipmentRouteLabels = {
  loading: "Loading",
  container: "Container",
  shipment: "Shipment",
  destination: "Destination",
};

const VIEWBOX_W = 1000;
const VIEWBOX_H = 60;
const STOPS_X = [80, 380, 660, 920];
const LINE_Y = 30;
const PATH_D = `M ${STOPS_X[0]} ${LINE_Y} L ${STOPS_X[1]} ${LINE_Y} L ${STOPS_X[2]} ${LINE_Y} L ${STOPS_X[3]} ${LINE_Y}`;

function pctX(x: number) {
  return `${(x / VIEWBOX_W) * 100}%`;
}

/**
 * "Export Shipment Journey" — the centerpiece interactive visual. Desktop (`lg:` and up) is a
 * horizontal 4-stop line (Loading → Container → Shipment → Destination) built the same way as
 * `SupplyNetworkVisual.tsx`'s diagram: an absolutely-positioned SVG carries only the connecting
 * line + a continuously-looping SMIL `<animateMotion>` dot, while the actual node content
 * (location chips, the container toggle, icons, labels) renders as normal HTML absolutely
 * positioned on top — same layering trick, just a linear chain instead of a hub-and-spoke.
 * Below `lg:`, a vertical timeline mirrors the same 4 stops top-to-bottom with zero horizontal
 * overflow, per the brief's explicit mobile mockup.
 */
export function ShipmentRouteVisual({
  locations,
  containerTypes,
  labels = DEFAULT_LABELS,
  containerSizeAriaLabel,
  containerSuffixTemplate,
}: {
  locations: ShipmentLoadingLocation[];
  containerTypes: ShipmentContainerType[];
  labels?: ShipmentRouteLabels;
  containerSizeAriaLabel?: string;
  /** Must contain the literal "{label}" placeholder. */
  containerSuffixTemplate?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useReducedMotion();
  const ShipIcon = SHIPMENT_ICONS.ship;
  const WorldMapOutline = DECORATIVE_SVGS.world_map_outline;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {locations.length > 0 && (
        <div className="mb-6 flex flex-col items-center gap-2">
          <ShipmentLocationChips locations={locations} />
          <span aria-hidden="true" className="h-6 w-0.5 bg-primary-300" />
        </div>
      )}

      {/* Desktop — horizontal 4-stop line */}
      <div className="relative hidden min-h-[320px] lg:block">
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-1/2 h-[3px] w-full -translate-y-1/2"
          aria-hidden="true"
        >
          <path
            d={PATH_D}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="6 8"
            className="stroke-primary-300"
            style={{
              strokeDashoffset: revealed ? 0 : 200,
              transition: "stroke-dashoffset 900ms ease-out 200ms",
              animation: revealed ? "supply-network-flow 1.6s linear infinite" : undefined,
            }}
          />
          {revealed && !reducedMotion && (
            <circle r={5} className="fill-primary-500">
              <animateMotion
                path={PATH_D}
                dur="10s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.42 0 0.58 1"
              />
            </circle>
          )}
        </svg>

        {/* Loading */}
        <div
          className={cn(
            "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 transition-[opacity,transform] duration-700",
            revealed ? "opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ left: pctX(STOPS_X[0]) }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-primary-600 shadow-[0_10px_30px_-10px_rgba(74,101,30,0.4)]">
            <SHIPMENT_ICONS.warehouse className="h-6 w-6" />
          </span>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-700">{labels.loading}</p>
        </div>

        {/* Container */}
        <div
          className={cn(
            "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-[opacity,transform] duration-700 delay-150",
            revealed ? "opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ left: pctX(STOPS_X[1]) }}
        >
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-700">{labels.container}</p>
          <ShipmentContainerToggle
            types={containerTypes}
            sizeAriaLabel={containerSizeAriaLabel}
            suffixTemplate={containerSuffixTemplate}
          />
        </div>

        {/* Shipment */}
        <div
          className={cn(
            "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 transition-[opacity,transform] duration-700 delay-300",
            revealed ? "opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ left: pctX(STOPS_X[2]) }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-primary-600 shadow-[0_10px_30px_-10px_rgba(74,101,30,0.4)]">
            <ShipIcon className="h-6 w-6" />
          </span>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-700">{labels.shipment}</p>
        </div>

        {/* Destination */}
        <div
          className={cn(
            "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 transition-[opacity,transform] duration-700 delay-500",
            revealed ? "opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ left: pctX(STOPS_X[3]) }}
        >
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_10px_30px_-10px_rgba(74,101,30,0.5)]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary-400"
              style={{ animation: revealed ? "supply-network-pulse-ring 3.5s ease-out infinite" : undefined }}
            />
            <WorldMapOutline className="h-8 w-8 opacity-80" />
          </span>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-700">{labels.destination}</p>
        </div>
      </div>

      {/* Mobile/tablet — vertical timeline */}
      <MobileShipmentTimeline
        containerTypes={containerTypes}
        labels={labels}
        containerSizeAriaLabel={containerSizeAriaLabel}
        containerSuffixTemplate={containerSuffixTemplate}
      />
    </div>
  );
}

function MobileShipmentTimeline({
  containerTypes,
  labels,
  containerSizeAriaLabel,
  containerSuffixTemplate,
}: {
  containerTypes: ShipmentContainerType[];
  labels: ShipmentRouteLabels;
  containerSizeAriaLabel?: string;
  containerSuffixTemplate?: string;
}) {
  const reducedMotion = useReducedMotion();
  const ShipIcon = SHIPMENT_ICONS.ship;
  const WorldMapOutline = DECORATIVE_SVGS.world_map_outline;

  const stops = [
    { key: "loading", label: labels.loading, icon: <SHIPMENT_ICONS.warehouse className="h-5 w-5" /> },
    {
      key: "container",
      label: labels.container,
      content: (
        <ShipmentContainerToggle
          types={containerTypes}
          sizeAriaLabel={containerSizeAriaLabel}
          suffixTemplate={containerSuffixTemplate}
        />
      ),
    },
    { key: "shipment", label: labels.shipment, icon: <ShipIcon className="h-5 w-5" /> },
    { key: "destination", label: labels.destination, icon: <WorldMapOutline className="h-6 w-6 opacity-80" /> },
  ];

  return (
    <div className="lg:hidden">
      <ol className="flex flex-col items-center gap-8">
        {stops.map((stop, index) => (
          <li key={stop.key} className="flex w-full flex-col items-center">
            {stop.icon && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-primary-600">
                {stop.icon}
              </span>
            )}
            <p className="mt-2 text-small font-semibold uppercase tracking-wide text-neutral-700">{stop.label}</p>
            {stop.content && <div className="mt-2">{stop.content}</div>}
            {index < stops.length - 1 && (
              <span className="relative mt-3 h-8 w-0.5 overflow-hidden bg-primary-200" aria-hidden="true">
                {!reducedMotion && (
                  <span
                    className="absolute inset-x-0 top-0 h-2 bg-primary-500"
                    style={{ animation: "shipment-mobile-flow 2.4s ease-in-out infinite" }}
                  />
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
