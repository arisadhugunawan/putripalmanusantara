"use client";

import { cn } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { SafeImage } from "@/components/SafeImage";

export interface GalleryGridItem {
  id: string;
  media: Media;
  caption?: string | null;
}

/**
 * FR-GAL-01/02/03 — responsive grid with lightbox viewer (next/prev, lazy-loaded thumbnails).
 * Reused for both the site Gallery and a single product's gallery (FR-PROD-04).
 */
export function GalleryGrid({ items }: { items: GalleryGridItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length],
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, showPrev, showNext]);

  if (items.length === 0) {
    return <p className="text-body text-neutral-600">No gallery items yet — check back soon.</p>;
  }

  const active = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
          >
            <SafeImage media={item.media} sizes="(min-width: 1024px) 25vw, 33vw" />
            <span className="absolute inset-0 bg-neutral-900/0 transition-colors duration-200 group-hover:bg-neutral-900/10" />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.media.alt_text}
          className="fixed inset-0 z-100 flex items-center justify-center bg-neutral-900/95 p-4"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <CloseIcon />
          </button>

          <button
            type="button"
            onClick={showPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/10 sm:left-4"
          >
            <ChevronIcon direction="left" />
          </button>

          <div className="relative h-[80vh] w-full max-w-4xl">
            {active.media.file_type === "image" ? (
              <Image
                src={active.media.file_url}
                alt={active.media.alt_text}
                fill
                sizes="100vw"
                className="object-contain"
              />
            ) : (
              <p className="flex h-full items-center justify-center text-body-lg text-white">
                {active.media.alt_text}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={showNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/10 sm:right-4"
          >
            <ChevronIcon direction="right" />
          </button>

          {active.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-small text-white/80">
              {active.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn("h-6 w-6", direction === "right" && "rotate-180")}
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
