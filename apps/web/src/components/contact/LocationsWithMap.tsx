"use client";

import type { ContactLocation } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { useState } from "react";
import { MapIcon, PinIcon } from "./icons";

/**
 * Sections 11-15 of the redesign brief, combined into one interactive unit: location cards
 * drive which location the main map shows. Selecting Tolitoli/Palu/Surabaya transitions the
 * map with a fade (client-side `key`-triggered CSS transition, no full page reload) and
 * activates that card visually — never touches the page's own scroll position or state.
 * Embeds via the same `q=<address>&output=embed` technique used everywhere else in this app
 * (no Maps API key needed); "Open in Google Maps" always uses the Admin's exact supplied URL
 * when set, falling back to a real-address search link otherwise — never a fabricated
 * coordinate.
 */
export function LocationsWithMap({
  locations,
  initialLocationId,
  heading,
  subtitle,
  openInGoogleMapsLabel,
  viewLocationLabel,
}: {
  locations: ContactLocation[];
  initialLocationId: string | null;
  heading: string;
  subtitle: string;
  openInGoogleMapsLabel: string;
  viewLocationLabel: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(initialLocationId ?? locations[0]?.id ?? "");
  const selected = locations.find((l) => l.id === selectedId) ?? locations[0] ?? null;

  if (locations.length === 0 || !selected) return null;

  const query = encodeURIComponent(selected.address);
  const openHref = selected.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div>
      <div className="text-center">
        <h2 className="text-h2 text-neutral-900">{heading}</h2>
        <p className="mx-auto mt-2 max-w-xl text-body text-neutral-600">{subtitle}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
        {/* Interactive map, with a floating info panel overlaid (brief §14) */}
        <div className="relative overflow-hidden rounded-card border border-neutral-200 shadow-[0_24px_48px_-24px_rgba(24,61,43,0.35)]">
          <div key={selected.id} className="h-[300px] animate-[article-hero-reveal_600ms_cubic-bezier(0.22,1,0.36,1)_both] sm:h-[380px] lg:h-[460px]">
            <iframe
              title={`${selected.name} location map`}
              src={`https://www.google.com/maps?q=${query}&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-card bg-white/95 p-4 shadow-card backdrop-blur-sm">
              <div className="min-w-0">
                <p className="text-small font-medium text-[#245C3A]">{selected.label || selected.name}</p>
                <p className="mt-0.5 truncate text-body font-medium text-neutral-900">{selected.name}</p>
              </div>
              <a
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open PPN location in Google Maps"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-button bg-[#183D2B] px-4 py-2 text-small font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#245C3A]"
              >
                {openInGoogleMapsLabel} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Location switcher cards */}
        <div className="flex flex-col gap-4">
          {locations.map((location) => {
            const isActive = location.id === selected.id;
            const locQuery = encodeURIComponent(location.address);
            const locHref = location.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${locQuery}`;
            return (
              <Card
                key={location.id}
                className={`group relative cursor-pointer transition-all duration-250 ease-out ${
                  isActive
                    ? "border-[#6FAF3A] shadow-[0_16px_36px_-16px_rgba(111,175,58,0.45)]"
                    : "border-neutral-200 hover:-translate-y-1 hover:border-[#6FAF3A]/40"
                }`}
                onClick={() => setSelectedId(location.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(location.id);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-field transition-all duration-250 ${
                      isActive
                        ? "bg-[#245C3A] text-white"
                        : "bg-[#EEF5E8] text-[#245C3A] group-hover:-translate-y-0.5"
                    }`}
                  >
                    <PinIcon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-lg font-medium text-neutral-900">{location.name}</p>
                    {location.label && <p className="mt-0.5 text-small text-neutral-500">{location.label}</p>}
                    <p className="mt-2 whitespace-pre-line text-small text-neutral-600">{location.address}</p>
                    <a
                      href={locHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${viewLocationLabel}: ${location.name}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-small font-medium text-[#245C3A] transition-all duration-200 group-hover:gap-2.5 hover:text-[#183D2B]"
                    >
                      <MapIcon size={16} />
                      {viewLocationLabel}
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
