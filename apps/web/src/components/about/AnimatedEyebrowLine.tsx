"use client";

import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";

/** Small accent line next to a section eyebrow that grows in once, the first time it scrolls
 * into view — same IntersectionObserver-driven reveal pattern as `FadeUpSection`, split out so
 * only this pixel-wide span needs to be a client component. Shared by every About Company
 * section using the PPN green palette (Legal & Certificates, Factory). */
export function AnimatedEyebrowLine() {
  const ref = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className="relative h-px w-8 overflow-hidden bg-[#DDE4DC]" aria-hidden="true">
      <span
        className={cn(
          "absolute inset-0 origin-left bg-[#6FAF3D] transition-transform duration-700 ease-out",
          revealed ? "scale-x-100" : "scale-x-0",
        )}
      />
    </span>
  );
}
