"use client";

import type { ExportDestination } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useState } from "react";
import { getFlagEmoji } from "./flag-emoji";

export function DestinationChipList({
  destinations,
  selectedCode,
  onSelect,
}: {
  destinations: ExportDestination[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = destinations.filter((d) =>
    d.country_name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-small font-semibold uppercase tracking-wide text-neutral-500">
          Export Destinations
        </h3>
        <div className="relative w-full max-w-[240px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destination..."
            aria-label="Search export destination"
            className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-small text-neutral-900 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-small text-neutral-500">No destination matches &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.country_code)}
              aria-pressed={selectedCode === d.country_code}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-small font-medium transition-colors duration-200",
                selectedCode === d.country_code
                  ? "border-primary-700 bg-primary-700 text-white"
                  : d.featured
                    ? "border-primary-300 bg-primary-50 text-primary-700 hover:border-primary-500"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50",
              )}
            >
              <span aria-hidden="true">{getFlagEmoji(d.country_code)}</span>
              {d.country_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
