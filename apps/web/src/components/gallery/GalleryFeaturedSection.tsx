"use client";

import { Container } from "@ppn/ui-components";
import type { GalleryItem } from "@ppn/shared-types";
import type { Dictionary } from "@/i18n/dictionary.d";
import { GalleryCard } from "./GalleryCard";

/** "Inside PPN" — 1 large (60%) + up to 3 small (40%) cards from admin-marked `featured` items.
 * Renders nothing when there are no featured items yet (no fabricated placeholder content). */
export function GalleryFeaturedSection({
  items,
  onOpen,
  dictionary,
}: {
  items: GalleryItem[];
  onOpen: (item: GalleryItem) => void;
  dictionary: Dictionary["gallery"];
}) {
  if (items.length === 0) return null;

  const [main, ...rest] = items.slice(0, 4);
  const secondary = rest;

  return (
    <Container className="py-12 lg:py-16">
      <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
        <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
        {dictionary.featuredEyebrow}
      </p>
      <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">{dictionary.featuredHeading}</h2>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GalleryCard
            item={main}
            onOpen={() => onOpen(main)}
            fallbackAspectRatio="4 / 3"
            sizes="(min-width: 1024px) 55vw, 92vw"
            priority
            dictionary={dictionary}
          />
        </div>
        {secondary.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
            {secondary.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onOpen={() => onOpen(item)}
                fallbackAspectRatio="1 / 1"
                sizes="(min-width: 1024px) 22vw, 46vw"
                dictionary={dictionary}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
