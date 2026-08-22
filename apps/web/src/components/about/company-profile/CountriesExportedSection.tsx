"use client";

import type { ExportDestination } from "@ppn/shared-types";
import { useState } from "react";
import { FadeUpSection } from "../FadeUpSection";
import { CountryDetailModal } from "./CountryDetailModal";
import { flagEmoji } from "./flagEmoji";

/**
 * Section 16-22 of the redesign brief — "Countries We Have Exported To", flags instead of a
 * world map. Reuses the real `ExportDestination` records the Homepage's own Global Export
 * Reach map uses (curated independently here via `show_in_company_profile` — see README); a
 * country only ever appears once an Admin has actually activated it for this section, never a
 * claim this list invents. Flags are rendered as Unicode Regional Indicator emoji from the
 * country's ISO code — always the correct aspect ratio, no image asset to distort or fail to
 * load. Cards stagger-reveal on scroll (each wrapped in its own `FadeUpSection`, same
 * IntersectionObserver + CSS-transition mechanism used across this app, so the site's global
 * `prefers-reduced-motion` rule neutralizes it automatically).
 */
export function CountriesExportedSection({
  countries,
  heading,
  description,
}: {
  countries: ExportDestination[];
  heading: string;
  description: string;
}) {
  const [selected, setSelected] = useState<ExportDestination | null>(null);

  if (countries.length === 0) return null;

  return (
    <div>
      <div className="max-w-2xl">
        {heading && <h2 className="text-balance text-h2 text-neutral-900">{heading}</h2>}
        {description && <p className="mt-3 text-body-lg text-neutral-600">{description}</p>}
      </div>

      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {countries.map((country, index) => (
          <FadeUpSection key={country.id} style={{ transitionDelay: `${Math.min(index, 10) * 60}ms` }}>
            <button
              type="button"
              onClick={() => setSelected(country)}
              className="group flex w-full flex-col items-center gap-3 rounded-card border border-neutral-200 bg-white px-4 py-6 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#6FAF3A]/40 hover:shadow-[0_16px_32px_-16px_rgba(24,61,43,0.3)]"
            >
              <span
                className="text-[3.25rem] leading-none transition-transform duration-300 ease-out group-hover:scale-[1.04] sm:text-[4rem]"
                aria-hidden="true"
              >
                {flagEmoji(country.country_code)}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-body font-medium text-neutral-900 transition-colors duration-250 group-hover:text-[#245C3A]">
                  {country.country_name}
                </span>
                {country.region && <span className="text-small text-neutral-500">{country.region}</span>}
              </span>
            </button>
          </FadeUpSection>
        ))}
      </div>

      {selected && <CountryDetailModal country={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
