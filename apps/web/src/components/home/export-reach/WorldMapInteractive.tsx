"use client";

import type { ExportDestination } from "@ppn/shared-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { CountryInfoPanel } from "./CountryInfoPanel";
import { DestinationChipList } from "./DestinationChipList";
import { getFlagEmoji } from "./flag-emoji";

interface HoverState {
  code: string;
  name: string;
  x: number;
  y: number;
}

/**
 * Client-side interaction layer for the world map — receives the pre-rendered SVG (from
 * `WorldMapSvg.tsx`, a server component) as `children` so the ~170KB of path data never
 * enters the client JS bundle; this component only adds event-delegated hover/click/
 * keyboard handling, a cursor-following tooltip, and orchestrates the shared "selected
 * country" state across the map, info panel, chip list, and mobile dropdown selector.
 */
export function WorldMapInteractive({
  destinations,
  children,
}: {
  destinations: ExportDestination[];
  children: React.ReactNode;
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const byCode = useMemo(() => new Map(destinations.map((d) => [d.country_code, d])), [destinations]);
  const selectedDestination = selectedCode ? (byCode.get(selectedCode) ?? null) : null;

  // Toggle the `data-selected` attribute imperatively instead of re-rendering the whole
  // (server-rendered) SVG tree on every selection change — O(1) DOM writes, no React
  // reconciliation of 173 path elements.
  useEffect(() => {
    const root = svgWrapperRef.current;
    if (!root) return;
    const previous = root.querySelector('[data-selected="true"]');
    previous?.removeAttribute("data-selected");
    if (selectedCode) {
      root.querySelector(`[data-alpha2="${selectedCode}"]`)?.setAttribute("data-selected", "true");
    }
  }, [selectedCode]);

  function findCountryTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    const el = target.closest<HTMLElement>('[data-destination="true"]');
    return el;
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const el = findCountryTarget(event.target);
    if (!el) return;
    setSelectedCode(el.dataset.alpha2 ?? null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const el = findCountryTarget(event.target);
    if (!el) return;
    event.preventDefault();
    setSelectedCode(el.dataset.alpha2 ?? null);
  }

  function handlePointerMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = findCountryTarget(event.target);
    if (!el) {
      setHover(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    setHover({
      code: el.dataset.alpha2 ?? "",
      name: el.dataset.name ?? "",
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    });
  }

  function handleFocus(event: React.FocusEvent<HTMLDivElement>) {
    const el = findCountryTarget(event.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    setHover({
      code: el.dataset.alpha2 ?? "",
      name: el.dataset.name ?? "",
      x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
      y: rect.top - (containerRect?.top ?? 0),
    });
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setHover(null)}
        onFocus={handleFocus}
        onBlur={() => setHover(null)}
      >
        <div ref={svgWrapperRef}>{children}</div>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-field bg-neutral-900 px-3 py-1.5 text-small font-medium text-white shadow-[var(--shadow-card-hover)]"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <span className="mr-1" aria-hidden="true">
              {getFlagEmoji(hover.code)}
            </span>
            {hover.name}
            <span className="ml-1 text-primary-300">— Export Destination</span>
          </div>
        )}
      </div>

      {/* Mobile: tapping tiny country shapes is unreliable, so offer a dropdown selector
          that drives the same shared selection state. */}
      {destinations.length > 0 && (
        <div className="mt-6 sm:hidden">
          <label htmlFor="export-destination-select" className="text-small font-medium text-neutral-700">
            Select Export Destination
          </label>
          <select
            id="export-destination-select"
            value={selectedCode ?? ""}
            onChange={(e) => setSelectedCode(e.target.value || null)}
            className="mt-1.5 w-full rounded-field border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-900"
          >
            <option value="">Choose a country…</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.country_code}>
                {d.country_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6">
        <CountryInfoPanel destination={selectedDestination} />
      </div>

      <DestinationChipList destinations={destinations} selectedCode={selectedCode} onSelect={setSelectedCode} />
    </div>
  );
}
