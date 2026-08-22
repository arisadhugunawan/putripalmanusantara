"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-shot IntersectionObserver reveal — same technique used inline in
 * `DecorativeGraphics.tsx`/`SupplyNetworkVisual.tsx`, extracted here since the Article Detail
 * Page redesign needs it in several places (gallery images, related-article cards) rather than
 * once. Returns a ref to attach to the element and whether it has entered the viewport.
 */
export function useRevealOnScroll<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
}
