"use client";

import type { LegalCertificateDocument } from "@ppn/shared-types";
import { legalDocumentCategoryLabel } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;
const SWIPE_THRESHOLD_PX = 60;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Fullscreen document viewer for the Legal & Company Information gallery.
 *
 * "Instant feel" (brief item 62) comes from ordering, not from faking progress: the card's
 * already-decoded preview image is painted immediately as the base layer, and the full-size
 * asset (or the PDF) loads on top of it. There is never a blank modal or a blocking spinner —
 * only a thin progress hint while the high-resolution layer is still arriving.
 *
 * PDFs render through `<object>`, which falls back to its children when the browser has no PDF
 * plugin, so the user always gets either the real document or a working Open/Download path.
 */
export function DocumentViewer({
  documents,
  startIndex,
  onClose,
}: {
  documents: LegalCertificateDocument[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [fullResLoaded, setFullResLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);

  const doc = documents[index];
  const isPdf = doc?.file?.file_type === "pdf";
  const previewMedia = doc?.preview_image ?? (doc?.file?.file_type === "image" ? doc.file : null);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = current + delta;
        if (next < 0 || next >= documents.length) return current;
        return next;
      });
    },
    [documents.length],
  );

  // Reset per-document view state when the visible document changes. Adjusted during render
  // (React's documented "resetting state when a prop changes" pattern) rather than in an
  // effect, which would cost an extra render pass and briefly show the previous zoom.
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setZoom(1);
    setFullResLoaded(false);
    setFailed(false);
  }

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    // Locking scroll keeps the page behind from moving under the overlay on touch devices.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          onClose();
          return;
        case "ArrowLeft":
          go(-1);
          return;
        case "ArrowRight":
          go(1);
          return;
        case "+":
        case "=":
          setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
          return;
        case "-":
          setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
          return;
        case "0":
          setZoom(1);
          return;
        case "Tab": {
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go, onClose]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === dialogRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void dialogRef.current?.requestFullscreen();
    }
  }

  function handleTouchStart(event: React.TouchEvent) {
    if (event.touches.length === 2) {
      pinchStart.current = { distance: touchDistance(event.touches), zoom };
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (event.touches.length === 2 && pinchStart.current) {
      const ratio = touchDistance(event.touches) / pinchStart.current.distance;
      setZoom(clamp(pinchStart.current.zoom * ratio, ZOOM_MIN, ZOOM_MAX));
    }
  }

  function handleTouchEnd(event: React.TouchEvent) {
    pinchStart.current = null;
    const start = touchStart.current;
    touchStart.current = null;
    // Swiping only pages while un-zoomed; once zoomed in, the same gesture is panning.
    if (!start || zoom !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  }

  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[rgba(10,20,15,0.88)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${doc.title} — document viewer`}
        className="flex h-full flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-white sm:px-5">
          <div className="mr-auto min-w-0">
            <p className="truncate text-body font-medium">{doc.title}</p>
            <p className="truncate text-small text-white/70">
              {legalDocumentCategoryLabel(doc)}
              {documents.length > 1 && ` · ${index + 1} / ${documents.length}`}
            </p>
          </div>

          {!isPdf && (
            <>
              <ToolbarButton label="Zoom out" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} disabled={zoom <= ZOOM_MIN}>
                −
              </ToolbarButton>
              <span className="min-w-[3.2rem] text-center text-small tabular-nums text-white/80">
                {Math.round(zoom * 100)}%
              </span>
              <ToolbarButton label="Zoom in" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} disabled={zoom >= ZOOM_MAX}>
                +
              </ToolbarButton>
              <ToolbarButton label="Reset zoom" onClick={() => setZoom(1)} disabled={zoom === 1}>
                ⟲
              </ToolbarButton>
              <ToolbarButton label="Fit to screen" onClick={() => setZoom(1)} disabled={zoom === 1}>
                Fit
              </ToolbarButton>
            </>
          )}

          <ToolbarButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
            {isFullscreen ? "⤢" : "⛶"}
          </ToolbarButton>

          {doc.file && (
            <>
              <a
                href={doc.file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open original file for ${doc.title}`}
                className="rounded-button px-3 py-1.5 text-small font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                Open Original
              </a>
              <a
                href={doc.file.file_url}
                download
                aria-label={`Download ${doc.title}`}
                className="rounded-button px-3 py-1.5 text-small font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                Download
              </a>
            </>
          )}
          <ToolbarButton label="Close viewer" onClick={onClose} ref={closeRef}>
            ✕
          </ToolbarButton>
        </div>

        {/* Stage */}
        <div
          className="relative min-h-0 flex-1 overflow-auto px-3 pb-3 sm:px-5 sm:pb-5"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
            {failed ? (
              <ErrorState doc={doc} onRetry={() => { setFailed(false); setFullResLoaded(false); }} onClose={onClose} />
            ) : isPdf && doc.file ? (
              <object
                data={doc.file.file_url}
                type="application/pdf"
                aria-label={doc.title}
                className="h-full min-h-[60vh] w-full rounded-[14px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <ErrorState doc={doc} onRetry={() => setFailed(false)} onClose={onClose} embedded />
              </object>
            ) : (
              <div
                className="relative max-h-full w-full overflow-hidden rounded-[14px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* Base layer: the thumbnail the card already loaded — paints immediately. */}
                {previewMedia && (
                  <div className="relative aspect-3/4 w-full sm:aspect-4/3">
                    <Image
                      src={previewMedia.file_url}
                      alt={previewMedia.alt_text || doc.title}
                      fill
                      sizes="(min-width: 1024px) 900px, 100vw"
                      priority
                      className={cn(
                        "object-contain transition-opacity duration-300",
                        fullResLoaded ? "opacity-0" : "opacity-100",
                      )}
                    />
                    {/* High-resolution layer fades in on top once decoded. */}
                    {doc.file?.file_type === "image" && (
                      <Image
                        src={doc.file.file_url}
                        alt={doc.file.alt_text || doc.title}
                        fill
                        sizes="(min-width: 1024px) 900px, 100vw"
                        onLoad={() => setFullResLoaded(true)}
                        onError={() => setFailed(true)}
                        className={cn(
                          "object-contain transition-opacity duration-300",
                          fullResLoaded ? "opacity-100" : "opacity-0",
                        )}
                      />
                    )}
                  </div>
                )}
                {!previewMedia && <ErrorState doc={doc} onRetry={() => setFailed(false)} onClose={onClose} embedded />}
              </div>
            )}
          </div>

          {/* Subtle hint only for the high-resolution layer — never a blocking spinner. */}
          {!isPdf && previewMedia && doc.file?.file_type === "image" && !fullResLoaded && !failed && (
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-button bg-black/40 px-3 py-1 text-small text-white/80">
              Loading full resolution…
            </p>
          )}
        </div>

        {/* Paging */}
        {documents.length > 1 && (
          <div className="flex items-center justify-center gap-3 pb-4">
            <ToolbarButton label="Previous document" onClick={() => go(-1)} disabled={index === 0}>
              ← Prev
            </ToolbarButton>
            <ToolbarButton label="Next document" onClick={() => go(1)} disabled={index === documents.length - 1}>
              Next →
            </ToolbarButton>
          </div>
        )}
      </div>
    </div>
  );
}

const ToolbarButton = ({
  ref,
  label,
  onClick,
  disabled,
  children,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className="rounded-button px-3 py-1.5 text-small font-medium text-white/90 transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent"
  >
    {children}
  </button>
);

function ErrorState({
  doc,
  onRetry,
  onClose,
  embedded,
}: {
  doc: LegalCertificateDocument;
  onRetry: () => void;
  onClose: () => void;
  embedded?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 p-8 text-center", embedded ? "text-neutral-700" : "rounded-[14px] bg-white text-neutral-700")}>
      <p className="text-body">Unable to load this document.</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-small font-medium">
        <button type="button" onClick={onRetry} className="text-primary-700 underline">
          Retry
        </button>
        {doc.file && (
          <a href={doc.file.file_url} download className="text-primary-700 underline">
            Download Original
          </a>
        )}
        <button type="button" onClick={onClose} className="text-neutral-500 underline">
          Close
        </button>
      </div>
    </div>
  );
}

function touchDistance(touches: React.TouchList) {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
