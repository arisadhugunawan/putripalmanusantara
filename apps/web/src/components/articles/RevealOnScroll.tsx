"use client";

import { cn } from "@ppn/ui-components";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

/**
 * Fade + translateY + scale reveal wrapper — brief items 20/31 (inline images, related-article
 * cards). `delayMs` staggers a sequence of siblings (brief item 31: 80-120ms per card).
 */
export function RevealOnScroll({
  children,
  delayMs = 0,
  className,
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0",
        className,
      )}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
