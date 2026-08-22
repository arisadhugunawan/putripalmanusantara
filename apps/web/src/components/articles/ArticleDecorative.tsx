"use client";

import { useEffect, useRef } from "react";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";

const LeafOutline = DECORATIVE_SVGS.leaf_outline;
const PalmLeaf = DECORATIVE_SVGS.palm_leaf;
const WorldMapOutline = DECORATIVE_SVGS.world_map_outline;

const MAX_PARALLAX_PX = 16;

/**
 * Very subtle (2-5% opacity) coconut/global-trade visual identity for the article hero
 * background — brief items 8/9/25/26/27. Fixed composition, not CMS-managed: extending the
 * homepage's admin-configurable `DecorativeGraphic` system to a new "page" value would need a
 * page-picker added to `DecorativeGraphicEditor.tsx` plus new admin/service wiring for what is
 * explicitly meant to stay in the 2-5% opacity background-texture range, not user-facing
 * content — reuses the same hand-authored SVGs (`DecorativeSvgs.tsx`), just composed here
 * directly rather than through the CMS.
 *
 * Parallax drift uses the exact rAF-throttled `DecorativeGraphics.tsx` technique (CSS custom
 * property written directly in the scroll callback, no `setState`), explicitly gated behind
 * `prefers-reduced-motion` in JS — the global CSS-only reduced-motion rule can neutralize
 * `animation`/`transition` durations but has no way to stop a JS scroll listener.
 */
export function ArticleDecorative() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (el) {
          const rect = el.getBoundingClientRect();
          const centeredness = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
          const offset = Math.max(-MAX_PARALLAX_PX, Math.min(MAX_PARALLAX_PX, -centeredness * 20));
          el.style.setProperty("--article-decor-parallax", `${offset}px`);
        }
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ transform: "translateY(var(--article-decor-parallax, 0px))" }}
    >
      <LeafOutline className="animate-article-float absolute -left-16 top-10 h-72 w-72 text-primary-700/[0.04] sm:h-96 sm:w-96" />
      <PalmLeaf className="animate-article-float-slow absolute -right-10 top-1/3 h-64 w-64 text-accent-500/[0.05] sm:h-80 sm:w-80" />
      <WorldMapOutline className="absolute bottom-0 left-1/2 h-56 w-[36rem] -translate-x-1/2 text-primary-700/[0.03]" />
    </div>
  );
}
