"use client";

import type { DecorativeGraphic, DecorativeGraphicPlacement } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";
import { DECORATIVE_SVGS } from "./DecorativeSvgs";

const PLACEMENT_CLASSES: Record<DecorativeGraphicPlacement, string> = {
  hero_behind_content: "inset-0 flex items-center justify-center",
  center_background: "inset-0 flex items-center justify-center",
  top_left: "-left-8 -top-8 sm:left-0 sm:top-0",
  top_right: "-right-8 -top-8 sm:right-0 sm:top-0",
  bottom_left: "-left-8 -bottom-8 sm:left-0 sm:bottom-0",
  bottom_right: "-right-8 -bottom-8 sm:right-0 sm:bottom-0",
};

const MAX_PARALLAX_PX = 18;

/**
 * Renders a section's enabled low-opacity watermark graphics — absolutely positioned,
 * `pointer-events-none`/`aria-hidden` (purely decorative, never intercepts input or reaches
 * screen readers), gently fades in via IntersectionObserver, and drifts a few px on scroll
 * via a single passive scroll listener (CSS `transform` only, no layout properties).
 * Renders nothing when the CMS has no enabled graphics for this page — no default
 * decoration is hardcoded here.
 */
export function DecorativeGraphics({
  graphics,
  className,
  tone = "dark",
}: {
  graphics: DecorativeGraphic[];
  className?: string;
  /** "light" strokes for placement over a dark section (e.g. the hero); "dark" (default)
   * for the site's usual light/white sections. */
  tone?: "light" | "dark";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (el) {
          const rect = el.getBoundingClientRect();
          const centeredness = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
          const offset = Math.max(-MAX_PARALLAX_PX, Math.min(MAX_PARALLAX_PX, -centeredness * 24));
          el.style.setProperty("--decorative-parallax", `${offset}px`);
        }
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (graphics.length === 0) return null;

  return (
    <div ref={containerRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {graphics.map((graphic) => {
        const Svg = DECORATIVE_SVGS[graphic.variant];
        return (
          <div
            key={graphic.id}
            className={cn("absolute h-56 w-56 sm:h-72 sm:w-72", PLACEMENT_CLASSES[graphic.placement])}
            style={{
              opacity: visible ? graphic.opacity : 0,
              transform: `scale(${graphic.scale}) translateY(var(--decorative-parallax, 0px))`,
              transition: "opacity 500ms ease-out, transform 100ms linear",
            }}
          >
            <Svg className={cn("h-full w-full", tone === "light" ? "text-white" : "text-neutral-900")} />
          </div>
        );
      })}
    </div>
  );
}
