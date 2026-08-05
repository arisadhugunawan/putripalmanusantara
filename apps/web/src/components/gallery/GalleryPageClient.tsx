"use client";

import { cn } from "@ppn/ui-components";
import type { GalleryCategory, GalleryItem } from "@ppn/shared-types";
import { useMemo, useState } from "react";
import { GalleryGrid } from "./GalleryGrid";

const CATEGORIES: { value: GalleryCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "product", label: "Products" },
  { value: "facility", label: "Facilities" },
  { value: "production", label: "Production" },
  { value: "drone", label: "Drone" },
];

/** FR-GAL-01 — client-side category filter so the page itself stays static (SSG+ISR). */
export function GalleryPageClient({ items }: { items: GalleryItem[] }) {
  const [category, setCategory] = useState<GalleryCategory | "all">("all");

  const filtered = useMemo(
    () => (category === "all" ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setCategory(option.value)}
            aria-pressed={category === option.value}
            className={cn(
              "rounded-button px-4 py-2 text-body font-medium transition-colors",
              category === option.value
                ? "bg-primary-500 text-neutral-900"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <GalleryGrid items={filtered.map((item) => ({ id: item.id, media: item.media, caption: item.caption }))} />
    </div>
  );
}
