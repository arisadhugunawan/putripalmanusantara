"use client";

import type { Media } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { SafeImage } from "@/components/SafeImage";

export interface ProductImageViewerItem {
  id: string;
  media: Media;
}

/**
 * Section 2 "Product Overview" — large hero image + thumbnail strip, click (or the zoom
 * button) opens a full-screen lightbox. Shares the same keyboard/prev-next pattern as
 * GalleryGrid's lightbox but is a self-contained component: this page needs a hero-slider
 * presentation GalleryGrid doesn't offer, and duplicating a small lightbox here is safer
 * than refactoring GalleryGrid (which the standalone Gallery page also depends on).
 */
export function ProductImageViewer({
  items,
  fallback,
}: {
  items: ProductImageViewerItem[];
  /** Cover image to show when the product has no gallery yet. */
  fallback: Media | null;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const close = useCallback(() => setLightboxOpen(false), []);
  const showPrev = useCallback(
    () => setActive((i) => (i - 1 + items.length) % items.length),
    [items.length],
  );
  const showNext = useCallback(() => setActive((i) => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
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
  }, [lightboxOpen, close, showPrev, showNext]);

  if (items.length === 0) {
    return (
      <div className="relative aspect-4/3 overflow-hidden rounded-card">
        <SafeImage media={fallback} />
      </div>
    );
  }

  const current = items[active];

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`Zoom in on ${current.media.alt_text}`}
        className="group relative block aspect-4/3 w-full overflow-hidden rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        <SafeImage media={current.media} sizes="(min-width: 1024px) 50vw, 100vw" priority />
        <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow-card transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIcon />
        </span>
      </button>

      {items.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${items.length}`}
              aria-current={index === active ? "true" : undefined}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-field ring-2 transition-all duration-200",
                index === active ? "ring-primary-600" : "ring-transparent hover:ring-neutral-300",
              )}
            >
              <SafeImage media={item.media} sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.media.alt_text}
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

          {items.length > 1 && (
            <button
              type="button"
              onClick={showPrev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/10 sm:left-4"
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          <div className="relative h-[80vh] w-full max-w-4xl">
            <Image
              src={current.media.file_url}
              alt={current.media.alt_text}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {items.length > 1 && (
            <button
              type="button"
              onClick={showNext}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/10 sm:right-4"
            >
              <ChevronIcon direction="right" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 14.5 20 20M10 7.5v5M7.5 10h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
      className={direction === "right" ? "rotate-180" : undefined}
    >
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
