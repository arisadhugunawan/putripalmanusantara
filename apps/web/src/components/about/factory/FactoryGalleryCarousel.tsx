"use client";

import type { FactoryGalleryImage } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Dictionary } from "@/i18n/dictionary.d";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";

/** Same slow-autoplay speed as the "What We Supply" showcase — 8-15px/s brief range. */
const AUTO_SCROLL_PX_PER_SEC = 11;
/** Delay before autoplay resumes after the visitor stops interacting. */
const RESUME_DELAY_MS = 3000;

/**
 * "Factory in Pictures" — a premium 3D horizontal gallery, adapted from the "What We Supply"
 * product carousel (`WhatWeSupplyCarousel.tsx`): native scroll track (wheel/trackpad/drag/touch/
 * keyboard all work for free), scroll-distance depth (scale/opacity/rotateY/translateZ computed
 * from each card's distance to the track center, rAF-batched), slow continuous autoplay that
 * pauses instantly on interaction and resumes after `RESUME_DELAY_MS`, and a subtle
 * pointer-position tilt on the inner card layer. `prefers-reduced-motion` disables all of it —
 * the track stays fully usable via native scroll.
 *
 * Clicking a card opens the shared `GalleryLightbox` instead of navigating away.
 */
export function FactoryGalleryCarousel({
  images,
  dictionary,
}: {
  images: FactoryGalleryImage[];
  dictionary: Dictionary;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const depthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const [inView, setInView] = useState(false);

  const pausedUntilRef = useRef(0);
  const interactingRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const updateDepth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    const halfWidth = trackRect.width / 2 || 1;

    let closestIndex = 0;
    let closestDist = Infinity;

    depthRefs.current.forEach((card, index) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = cardCenter - centerX;
      const absDistance = Math.abs(distance);
      if (absDistance < closestDist) {
        closestDist = absDistance;
        closestIndex = index;
      }

      if (reducedMotion) {
        card.style.transform = "";
        card.style.opacity = "1";
        return;
      }

      const normalized = Math.min(absDistance / halfWidth, 1.3);
      const scale = Math.max(0.9, 1 - normalized * 0.1);
      const opacity = Math.max(0.7, 1 - normalized * 0.35);
      const rotateY = Math.max(-8, Math.min(8, (distance / halfWidth) * 8));
      const translateZ = -normalized * 50;
      card.style.transform = `perspective(1400px) translateZ(${translateZ}px) rotateY(${(-rotateY).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(2);
      card.style.zIndex = String(100 - Math.round(normalized * 10));
    });

    setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
  }, [reducedMotion]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateDepth();
        ticking = false;
      });
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    updateDepth();
    window.addEventListener("resize", updateDepth);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateDepth);
    };
  }, [updateDepth]);

  useEffect(() => {
    if (reducedMotion) return;
    let frameId: number;
    function step(time: number) {
      const track = trackRef.current;
      const last = lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;
      if (track && inView && !interactingRef.current && Date.now() >= pausedUntilRef.current && last != null) {
        const dt = time - last;
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll > 1) {
          const next = track.scrollLeft + (AUTO_SCROLL_PX_PER_SEC * dt) / 1000;
          track.scrollLeft = next >= maxScroll ? 0 : next;
        }
      }
      frameId = requestAnimationFrame(step);
    }
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [inView, reducedMotion]);

  function pause() {
    interactingRef.current = true;
  }
  function resumeAfterDelay() {
    interactingRef.current = false;
    pausedUntilRef.current = Date.now() + RESUME_DELAY_MS;
  }

  function scrollToIndex(index: number) {
    const card = depthRefs.current[index];
    const track = trackRef.current;
    if (!card || !track) return;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = cardRect.left - trackRect.left - (trackRect.width - cardRect.width) / 2;
    track.scrollBy({ left: delta, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function handlePrev() {
    pause();
    scrollToIndex(Math.max(0, activeIndex - 1));
    resumeAfterDelay();
  }
  function handleNext() {
    pause();
    scrollToIndex(Math.min(images.length - 1, activeIndex + 1));
    resumeAfterDelay();
  }

  function handleTiltMove(index: number, event: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const inner = tiltRefs.current[index];
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    inner.style.transform = `translateY(-6px) scale(1.02) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  }
  function handleTiltLeave(index: number) {
    const inner = tiltRefs.current[index];
    if (!inner) return;
    inner.style.transform = "";
  }

  if (images.length === 0) return null;

  return (
    <div>
      <div
        ref={trackRef}
        role="region"
        aria-label={dictionary.aboutCompany.factory.galleryScrollableAriaLabel}
        tabIndex={0}
        onPointerDown={pause}
        onPointerUp={resumeAfterDelay}
        onPointerCancel={resumeAfterDelay}
        onWheel={() => {
          pause();
          resumeAfterDelay();
        }}
        onTouchStart={pause}
        onTouchEnd={resumeAfterDelay}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            handlePrev();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            handleNext();
          }
        }}
        className="flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF3D] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        style={{ perspective: "1400px" }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            ref={(el) => {
              depthRefs.current[index] = el;
            }}
            className="w-[78%] shrink-0 snap-center transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[52%] md:w-[38%] lg:w-[28%]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              ref={(el) => {
                tiltRefs.current[index] = el;
              }}
              onMouseMove={(event) => handleTiltMove(index, event)}
              onMouseLeave={() => handleTiltLeave(index)}
              className="group transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={dictionary.aboutCompany.factory.viewFullscreenAriaTemplate.replace(
                  "{title}",
                  image.title ?? dictionary.aboutCompany.factory.photoFallbackTitle,
                )}
                className="relative block aspect-4/3 w-full cursor-pointer overflow-hidden rounded-[22px] bg-[#F7F9F4] text-left shadow-[0_20px_45px_-20px_rgba(24,61,43,0.35)]"
              >
                <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                  <Image
                    src={image.media.file_url}
                    alt={image.alt_text || image.title || dictionary.aboutCompany.factory.photoFallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 28vw, (min-width: 640px) 52vw, 78vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-[#202522]/0 opacity-0 transition-[opacity,background-color] duration-300 ease-out group-hover:bg-[#202522]/40 group-hover:opacity-100">
                  <span className="flex translate-y-1.5 items-center gap-2 text-small font-semibold uppercase tracking-[0.1em] text-white transition-transform duration-300 ease-out group-hover:translate-y-0">
                    <ZoomIcon className="h-4 w-4" />
                    {dictionary.aboutCompany.factory.viewImageCta}
                  </span>
                </div>
              </button>
              <div className="mt-4">
                {image.category && (
                  <span className="text-small font-semibold uppercase tracking-[0.08em] text-[#6FAF3D]">
                    {image.category}
                  </span>
                )}
                {image.title && <h3 className="mt-1 text-body-lg font-medium text-[#202522]">{image.title}</h3>}
                {image.caption && <p className="mt-1 text-small text-[#68736B]">{image.caption}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label={dictionary.aboutCompany.factory.prevPhotoAriaLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DDE4DC] bg-white text-[#68736B] transition-all duration-250 ease-out hover:border-[#315F3A] hover:bg-[#315F3A] hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className="text-small font-medium tabular-nums text-[#68736B]">
          {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex === images.length - 1}
          aria-label={dictionary.aboutCompany.factory.nextPhotoAriaLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DDE4DC] bg-white text-[#68736B] transition-all duration-250 ease-out hover:border-[#315F3A] hover:bg-[#315F3A] hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          fallbackAlt={dictionary.aboutCompany.factory.photoFallbackAltShort}
        />
      )}
    </div>
  );
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" strokeLinecap="round" />
    </svg>
  );
}
