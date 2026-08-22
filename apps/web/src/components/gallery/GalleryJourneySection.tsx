"use client";

import { Container } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import { useEffect, useRef, useState } from "react";
import { GalleryCategoryShowcaseCard } from "./GalleryCategoryShowcaseCard";

export interface JourneyPanel {
  id: string;
  name: string;
  description?: string;
  previewImage: Media | null;
  itemCount: number;
}

/**
 * Horizontal "journey" through every gallery category — a native CSS `scroll-snap-type: x
 * mandatory` track (not a custom JS scroll-hijack): wheel/trackpad/drag/touch/keyboard all work
 * for free, it never traps vertical scroll at either end (brief §40's own warning against
 * losing the visitor's scroll control), and it degrades to a plain swipeable row under
 * `prefers-reduced-motion` or on any input device — there's no separate "desktop-only" code
 * path to keep in sync. An `IntersectionObserver` per panel drives the "0X / 10" progress
 * readout and thin progress line without any scroll-position math.
 */
export function GalleryJourneySection({
  panels,
  onViewCategory,
}: {
  panels: JourneyPanel[];
  onViewCategory: (id: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = panelRefs.current.findIndex((el) => el === visible.target);
        if (idx !== -1) setActiveIndex(idx);
      },
      { root: track, threshold: [0.5, 0.75] },
    );
    panelRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [panels.length]);

  if (panels.length === 0) return null;
  const active = panels[activeIndex];

  return (
    <div className="border-y border-neutral-100 bg-neutral-50/60 py-12 lg:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
              The PPN Journey
            </p>
            <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">From warehouse to worldwide</h2>
          </div>
          <div className="text-right">
            <p className="text-body font-semibold text-neutral-900">{active.name}</p>
            <p className="text-small tabular-nums text-neutral-500">
              {String(activeIndex + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-primary-500 transition-[width] duration-300 ease-out"
            style={{ width: `${((activeIndex + 1) / panels.length) * 100}%` }}
          />
        </div>
      </Container>

      <div
        ref={trackRef}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc((100vw-1280px)/2+1rem))] pb-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {panels.map((panel, index) => (
          <div
            key={panel.id}
            ref={(el) => {
              panelRefs.current[index] = el;
            }}
            className="w-[85vw] shrink-0 snap-center sm:w-[420px]"
          >
            <GalleryCategoryShowcaseCard
              index={index}
              name={panel.name}
              description={panel.description}
              previewImage={panel.previewImage}
              itemCount={panel.itemCount}
              onView={() => onViewCategory(panel.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
