"use client";

import { useEffect, useRef } from "react";

/**
 * Thin (3px) fixed progress indicator — brief item 3. Width is driven by writing a CSS custom
 * property directly in a rAF-throttled scroll listener (same technique as
 * `DecorativeGraphics.tsx`'s parallax), never via `setState`, so the bar updates at 60fps
 * without triggering a React re-render on every scroll tick.
 *
 * Tracks progress through `targetRef`'s content (the article body), not the whole document —
 * reaching 100% when the reader finishes the article, not when they hit the page's absolute
 * bottom (which would include Related Insights/Footer and under-report completion).
 */
export function ReadingProgressBar({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    function update() {
      const el = targetRef.current;
      const bar = barRef.current;
      if (!el || !bar) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      bar.style.setProperty("--article-progress", String(progress));
    }

    function onScroll() {
      if (reduceMotion) {
        update();
        return;
      }
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetRef]);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" aria-hidden="true">
      <div
        ref={barRef}
        className="article-progress-bar h-full w-full bg-primary-500 transition-transform duration-100 ease-out"
      />
    </div>
  );
}
