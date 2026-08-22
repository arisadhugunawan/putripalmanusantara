"use client";

import type { WhatWeDoItem } from "@ppn/shared-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";

/** Brief: "8–15px per second" — the slow, continuous auto-scroll speed. */
const AUTO_SCROLL_PX_PER_SEC = 11;
/** Brief: "delay sekitar 2–4 detik" before autoplay resumes after user interaction. */
const RESUME_DELAY_MS = 3000;

/**
 * "What We Supply" product showcase — a native horizontally-scrollable track (not a carousel
 * library: wheel/trackpad/drag/touch/keyboard all work for free via the browser's own scroll
 * behaviour) with three independent motion layers stacked per card:
 *
 * 1. Scroll-distance 3D depth (outer wrapper, `depthRefs`) — scale/opacity/rotateY/translateZ
 *    computed from each card's distance to the track's horizontal center, recomputed at most
 *    once per animation frame via a single rAF-batched scroll listener (never per scroll event).
 * 2. Slow continuous autoplay (`requestAnimationFrame`, elapsed-time-based so speed is frame-rate
 *    independent) — pauses the instant the user touches/drags/wheels/tabs the track, and only
 *    resumes after `RESUME_DELAY_MS` of no interaction.
 * 3. Subtle pointer-position tilt (inner wrapper, `tiltRefs`) — independent of layer 1 so the two
 *    transforms never clobber each other; reset with a CSS transition on pointer leave.
 *
 * `prefers-reduced-motion` disables all three layers (a plain browser-native horizontal scroll
 * remains fully usable via wheel/drag/touch/arrow buttons).
 */
export function WhatWeSupplyCarousel({ items }: { items: WhatWeDoItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const depthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [inView, setInView] = useState(false);

  const pausedUntilRef = useRef(0);
  const interactingRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
      const scale = Math.max(0.88, 1 - normalized * 0.12);
      const opacity = Math.max(0.6, 1 - normalized * 0.45);
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
    scrollToIndex(Math.min(items.length - 1, activeIndex + 1));
    resumeAfterDelay();
  }

  function handleTiltMove(index: number, event: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const inner = tiltRefs.current[index];
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    inner.style.transform = `translateY(-8px) scale(1.02) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  }
  function handleTiltLeave(index: number) {
    const inner = tiltRefs.current[index];
    if (!inner) return;
    inner.style.transform = "";
  }

  if (items.length === 0) return null;

  return (
    <div>
      <div
        ref={trackRef}
        role="region"
        aria-label="Product showcase, scrollable"
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
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF3A] [&::-webkit-scrollbar]:hidden"
        style={{ perspective: "1400px" }}
      >
        {items.map((item, index) => {
          const image = item.product?.cover_image ?? item.media;
          return (
            <div
              key={item.id}
              ref={(el) => {
                depthRefs.current[index] = el;
              }}
              className="w-[82%] shrink-0 snap-center transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[58%] md:w-[44%] lg:w-[32%] xl:w-[29%]"
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
                <div className="relative aspect-4/3 overflow-hidden rounded-[24px] bg-neutral-100 shadow-[0_20px_45px_-20px_rgba(24,61,43,0.35)]">
                  <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                    <SafeImage
                      media={image}
                      sizes="(min-width: 1280px) 29vw, (min-width: 1024px) 32vw, (min-width: 768px) 44vw, (min-width: 640px) 58vw, 82vw"
                      priority={index === 0}
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-small font-semibold tracking-[0.08em] text-[#6FAF3A]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 text-h3 text-balance text-neutral-900">{item.title}</h3>
                  {item.product && (
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-small font-medium text-[#245C3A] transition-all duration-250 ease-out hover:gap-2.5 hover:text-[#183D2B]"
                    >
                      View Product <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous product"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-250 ease-out hover:border-[#245C3A] hover:bg-[#245C3A] hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className="text-small font-medium tabular-nums text-neutral-500">
          {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex === items.length - 1}
          aria-label="Next product"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-250 ease-out hover:border-[#245C3A] hover:bg-[#245C3A] hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
        {items.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
              index === activeIndex ? "w-6 bg-[#6FAF3A]" : "w-1.5 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
