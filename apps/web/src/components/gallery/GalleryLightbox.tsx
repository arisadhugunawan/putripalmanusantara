"use client";

import type { GalleryMediaType, Media } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { TikTokEmbed } from "@/components/about/factory/TikTokEmbed";
import { YouTubeVideoEmbed } from "@/components/about/company-profile/YouTubeVideoEmbed";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;
const SWIPE_THRESHOLD_PX = 60;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Minimal structural shape a gallery image needs to satisfy — both `FactoryGalleryImage` and
 * `FacilityGalleryImageItem` match this field-for-field, so either can be passed with zero
 * adapter code. */
export interface GalleryLightboxImage {
  id: string;
  media: Media | null;
  /** Omitted (defaults to "image") by the 2 original image-only call sites — when set to
   * "video"/"youtube"/"tiktok", the lightbox renders that item's embed in place of the
   * zoomable `<img>` and hides the zoom/pinch controls (not meaningful for video/embeds). */
  media_type?: GalleryMediaType;
  external_url?: string | null;
  title: string | null;
  caption: string | null;
  category: string | null;
  alt_text: string | null;
}

export interface GalleryLightboxLabels {
  zoomOut: string;
  zoomIn: string;
  fitToScreen: string;
  fitShort: string;
  exitFullscreen: string;
  fullscreen: string;
  close: string;
  previous: string;
  next: string;
  prevShort: string;
  nextShort: string;
  /** Must contain the literal "{name}" placeholder. */
  ariaTemplate: string;
}

const DEFAULT_LABELS: GalleryLightboxLabels = {
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  fitToScreen: "Fit to screen",
  fitShort: "Fit",
  exitFullscreen: "Exit fullscreen",
  fullscreen: "Fullscreen",
  close: "Close viewer",
  previous: "Previous image",
  next: "Next image",
  prevShort: "Prev",
  nextShort: "Next",
  ariaTemplate: "{name} — image viewer",
};

/**
 * Fullscreen premium lightbox — originally built for the Factory gallery (adapted from the
 * Legal & Certificates `DocumentViewer`, minus the PDF branch and the preview/full-res
 * two-layer load), generalized here so any gallery of `{ id, media, title?, caption?,
 * category?, alt_text? }` items can reuse the same zoom/pinch/swipe/keyboard/focus-trap/
 * fullscreen mechanics — e.g. the Factory gallery and the Facilities gallery.
 *
 * `labels` is optional (defaults to English) — the standalone Gallery page and the Factory
 * carousel keep their original English toolbar text; the Facilities page passes its own
 * translated labels via this prop.
 */
export function GalleryLightbox<T extends GalleryLightboxImage>({
  images,
  startIndex,
  onClose,
  fallbackAlt = "Photo",
  labels = DEFAULT_LABELS,
}: {
  images: T[];
  startIndex: number;
  onClose: () => void;
  /** Alt text used when an image has neither its own `alt_text` nor a `title`. */
  fallbackAlt?: string;
  labels?: GalleryLightboxLabels;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);

  const image = images[index];
  const mediaType = image?.media_type ?? "image";
  const isImage = mediaType === "image";

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = current + delta;
        if (next < 0 || next >= images.length) return current;
        return next;
      });
    },
    [images.length],
  );

  // Reset zoom when the visible image changes — adjusted during render (React's documented
  // "resetting state when a prop changes" pattern) rather than in an effect, which would cost an
  // extra render pass and briefly show the previous zoom.
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setZoom(1);
  }

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
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
    if (!start || zoom !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  }

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[rgba(10,20,15,0.88)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.ariaTemplate.replace("{name}", image.title ?? fallbackAlt)}
        className="flex h-full flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-white sm:px-5">
          <div className="mr-auto min-w-0">
            {image.title && <p className="truncate text-body font-medium">{image.title}</p>}
            <p className="truncate text-small text-white/70">
              {image.category}
              {image.category && images.length > 1 && " · "}
              {images.length > 1 && `${index + 1} / ${images.length}`}
            </p>
          </div>

          {isImage && (
            <>
              <ToolbarButton label={labels.zoomOut} onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} disabled={zoom <= ZOOM_MIN}>
                −
              </ToolbarButton>
              <span className="min-w-[3.2rem] text-center text-small tabular-nums text-white/80">
                {Math.round(zoom * 100)}%
              </span>
              <ToolbarButton label={labels.zoomIn} onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} disabled={zoom >= ZOOM_MAX}>
                +
              </ToolbarButton>
              <ToolbarButton label={labels.fitToScreen} onClick={() => setZoom(1)} disabled={zoom === 1}>
                {labels.fitShort}
              </ToolbarButton>
            </>
          )}
          <ToolbarButton label={isFullscreen ? labels.exitFullscreen : labels.fullscreen} onClick={toggleFullscreen}>
            {isFullscreen ? "⤢" : "⛶"}
          </ToolbarButton>
          <ToolbarButton label={labels.close} onClick={onClose} ref={closeRef}>
            ✕
          </ToolbarButton>
        </div>

        <div
          className="relative min-h-0 flex-1 overflow-auto px-3 pb-3 sm:px-5 sm:pb-5"
          onTouchStart={isImage ? handleTouchStart : undefined}
          onTouchMove={isImage ? handleTouchMove : undefined}
          onTouchEnd={isImage ? handleTouchEnd : undefined}
        >
          <div className="mx-auto flex h-full max-w-5xl items-center justify-center">
            {mediaType === "image" && image.media ? (
              <div
                className="relative aspect-4/3 max-h-full w-full overflow-hidden rounded-[14px] bg-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoom})` }}
              >
                <Image
                  src={image.media.file_url}
                  alt={image.alt_text || image.title || fallbackAlt}
                  fill
                  sizes="(min-width: 1024px) 1000px, 100vw"
                  priority
                  className="object-contain"
                />
              </div>
            ) : mediaType === "video" && image.media ? (
              <video
                src={image.media.file_url}
                controls
                autoPlay
                className="max-h-full w-full rounded-[14px] bg-neutral-900"
              />
            ) : mediaType === "youtube" ? (
              <div className="w-full max-w-3xl">
                <YouTubeVideoEmbed url={image.external_url ?? null} />
              </div>
            ) : mediaType === "tiktok" && image.external_url ? (
              <div className="w-full max-w-sm">
                <TikTokEmbed url={image.external_url} />
              </div>
            ) : null}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex items-center justify-center gap-3 pb-4">
            <ToolbarButton label={labels.previous} onClick={() => go(-1)} disabled={index === 0}>
              ← {labels.prevShort}
            </ToolbarButton>
            <ToolbarButton label={labels.next} onClick={() => go(1)} disabled={index === images.length - 1}>
              {labels.nextShort} →
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

function touchDistance(touches: React.TouchList) {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
