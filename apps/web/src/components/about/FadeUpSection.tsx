"use client";

import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";

/** Fades a section up into place the first time it enters the viewport. IntersectionObserver
 * (not a scroll listener) triggers a one-time class toggle; the animation itself is
 * transform + opacity only (compositor-friendly, no layout thrashing), and
 * prefers-reduced-motion is already neutralized globally in globals.css. */
export function FadeUpSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-[400ms] ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
