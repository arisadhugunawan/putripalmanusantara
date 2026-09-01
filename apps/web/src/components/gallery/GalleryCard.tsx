"use client";

import type { GalleryItem } from "@ppn/shared-types";
import { useRef } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { SafeImage } from "@/components/SafeImage";
import { extractYouTubeId } from "@/components/about/company-profile/YouTubeVideoEmbed";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Shared masonry/featured card — real intrinsic aspect ratio when the stored media has
 * width/height (image/self-hosted video), a sensible fallback ratio for youtube/tiktok items
 * (which carry no stored dimension). Mouse-tracked 3D tilt reuses the exact math already used
 * by `FactoryGalleryCarousel.tsx`'s hover effect; disabled under `prefers-reduced-motion` and
 * never wired up on touch (no `onMouseMove` support there anyway). */
export function GalleryCard({
  item,
  onOpen,
  fallbackAspectRatio = "4 / 5",
  sizes = "(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw",
  priority = false,
  dictionary,
}: {
  item: GalleryItem;
  onOpen: () => void;
  fallbackAspectRatio?: string;
  sizes?: string;
  priority?: boolean;
  dictionary: Dictionary["gallery"];
}) {
  const reducedMotion = useReducedMotion();
  const innerRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const inner = innerRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    inner.style.transform = `translateY(-6px) scale(1.02) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  }
  function handleMouseLeave() {
    if (innerRef.current) innerRef.current.style.transform = "";
  }

  const aspectRatio =
    item.media?.width && item.media?.height ? `${item.media.width} / ${item.media.height}` : fallbackAspectRatio;
  const isVideo = item.media_type !== "image";

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group [perspective:1000px]"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={dictionary.viewFullscreenAriaTemplate.replace("{name}", item.title ?? item.category.name)}
        className="block w-full break-inside-avoid overflow-hidden rounded-[20px] text-left"
      >
        <div
          ref={innerRef}
          className="relative w-full overflow-hidden rounded-[20px] bg-neutral-100 shadow-[0_16px_40px_-20px_rgba(24,61,43,0.3)] transition-transform duration-300 ease-out"
          style={{ aspectRatio }}
        >
          <CardThumbnail item={item} sizes={sizes} priority={priority} dictionary={dictionary} />
          <div className="absolute inset-0 bg-neutral-900/0 opacity-0 transition-[opacity,background-color] duration-300 ease-out group-hover:bg-neutral-900/35 group-hover:opacity-100" />
          {isVideo ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-lg transition-[opacity,transform] duration-250 ease-out group-hover:scale-110 group-hover:opacity-100">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#183D2B" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          ) : (
            <span className="absolute inset-x-3 bottom-3 flex translate-y-1.5 items-center gap-1 text-small font-semibold uppercase tracking-[0.1em] text-white opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
              {dictionary.viewGalleryCta}
              <span aria-hidden="true">→</span>
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

function CardThumbnail({
  item,
  sizes,
  priority,
  dictionary,
}: {
  item: GalleryItem;
  sizes: string;
  priority: boolean;
  dictionary: Dictionary["gallery"];
}) {
  if (item.media_type === "image" || item.media_type === "video") {
    if (item.media_type === "video" && item.media) {
      return (
        <video
          src={item.media.file_url}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
    }
    return <SafeImage media={item.media} sizes={sizes} priority={priority} emptyLabel={dictionary.imageComingSoonAriaLabel} />;
  }

  if (item.media_type === "youtube") {
    const videoId = item.external_url ? extractYouTubeId(item.external_url) : null;
    if (videoId) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- external YouTube-hosted thumbnail, not an optimizable local/remote asset
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary-50 to-neutral-100">
      <span className="text-small font-medium text-primary-700/60">
        {item.media_type === "tiktok" ? dictionary.tiktokVideoLabel : dictionary.videoLabel}
      </span>
    </div>
  );
}
