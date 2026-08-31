"use client";

import type { ProductGalleryItem } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * "Specification & Lab. Test" — the specification sheet and laboratory-report scans an Admin
 * filed under the `spec_lab` placement.
 *
 * These are documents, so they are always rendered `object-contain` on a white surface: cropping
 * a lab report can hide the very figures a buyer came to check. Clicking one opens it full size;
 * PDFs open in a new tab instead, since a scan and a PDF need different viewers.
 */
export function SpecLabDocuments({
  items,
  openPdfDocumentLabel = "OPEN PDF DOCUMENT",
  viewFullSizeAriaTemplate = "View {name} full size",
  closeDocumentLabel = "Close document",
}: {
  items: ProductGalleryItem[];
  openPdfDocumentLabel?: string;
  /** Must contain the literal "{name}" placeholder. */
  viewFullSizeAriaTemplate?: string;
  closeDocumentLabel?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : Math.max(0, i - 1)));
      if (event.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? i : Math.min(items.length - 1, i + 1)));
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [openIndex, items.length]);

  if (items.length === 0) return null;

  const open = openIndex === null ? null : items[openIndex];

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 gap-5",
          items.length > 1 ? "md:grid-cols-2" : "max-w-2xl",
        )}
      >
        {items.map((item, index) => {
          const isPdf = item.media.file_type === "pdf";
          return (
            <figure key={item.id} className="flex flex-col">
              {isPdf ? (
                <a
                  href={item.media.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-card border border-neutral-200 bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className="text-small font-semibold tracking-wide text-primary-700">
                    {openPdfDocumentLabel}
                  </span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={viewFullSizeAriaTemplate.replace(
                    "{name}",
                    item.caption || item.media.alt_text,
                  )}
                  className="group relative aspect-4/3 overflow-hidden rounded-card border border-neutral-200 bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <Image
                    src={item.media.file_url}
                    alt={item.caption || item.media.alt_text}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                </button>
              )}
              {item.caption && (
                <figcaption className="mt-2 text-small text-neutral-600">{item.caption}</figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.caption || open.media.alt_text}
          className="fixed inset-0 z-100 flex flex-col bg-neutral-900/95 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <div className="flex items-center justify-between gap-4 pb-3 text-white">
            <p className="min-w-0 truncate text-body font-medium">
              {open.caption || open.media.alt_text}
              {items.length > 1 && (
                <span className="ml-2 text-small text-white/70">
                  {(openIndex ?? 0) + 1} / {items.length}
                </span>
              )}
            </p>
            <button
              ref={closeRef}
              type="button"
              aria-label={closeDocumentLabel}
              onClick={() => setOpenIndex(null)}
              className="rounded-button px-3 py-1.5 text-small font-medium text-white/90 hover:bg-white/10"
            >
              ✕
            </button>
          </div>
          <div className="relative min-h-0 flex-1" onClick={(event) => event.stopPropagation()}>
            <Image
              src={open.media.file_url}
              alt={open.caption || open.media.alt_text}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
