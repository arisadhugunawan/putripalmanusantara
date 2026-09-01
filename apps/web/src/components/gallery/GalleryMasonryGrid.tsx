"use client";

import type { GalleryItem } from "@ppn/shared-types";
import type { Dictionary } from "@/i18n/dictionary.d";
import { GalleryCard } from "./GalleryCard";

const FALLBACK_RATIOS = ["4 / 5", "1 / 1", "16 / 9", "3 / 4"];

/** CSS `columns` masonry — no JS packing algorithm needed. Each card keeps its own real
 * intrinsic aspect ratio (image/self-hosted video dimensions from the DB) when available; items
 * without one (youtube/tiktok) rotate through a small set of ratios so the grid still reads as
 * "varied sizes" rather than a uniform wall, without fabricating a fake aspect ratio. */
export function GalleryMasonryGrid({
  items,
  onOpen,
  dictionary,
}: {
  items: GalleryItem[];
  onOpen: (index: number) => void;
  dictionary: Dictionary["gallery"];
}) {
  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
      {/* No `priority` here — `GalleryFeaturedSection` above this grid already marks its own
          main card `priority`, and that's the section actually visible above the fold; giving
          more images `priority` too just makes them compete with the real LCP candidate for
          bandwidth instead of loading lazily as the visitor scrolls to them. */}
      {items.map((item, index) => (
        <GalleryCard
          key={item.id}
          item={item}
          onOpen={() => onOpen(index)}
          fallbackAspectRatio={FALLBACK_RATIOS[index % FALLBACK_RATIOS.length]}
          dictionary={dictionary}
        />
      ))}
    </div>
  );
}
