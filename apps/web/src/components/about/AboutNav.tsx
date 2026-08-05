"use client";

import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";

export interface AboutSection {
  id: string;
  label: string;
}

/** Sticky header can be up to ~88px tall (unshrunk desktop logo); a generous static
 * offset is simpler and more robust than re-measuring the header on every scroll frame,
 * and the visual cost of a few extra px of clearance is negligible. */
const SCROLL_OFFSET_PX = 96;
const SCROLL_DURATION_MS = 600;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Custom rAF-driven smooth scroll (not native `scrollIntoView({behavior:"smooth"})`) —
 * the brief calls for a specific 500–700ms duration and header-aware offset, neither of
 * which the native smooth-scroll API exposes. Respects prefers-reduced-motion by jumping
 * instantly instead of animating. */
function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startY = window.scrollY;
  const targetY = startY + target.getBoundingClientRect().top - SCROLL_OFFSET_PX;

  if (prefersReducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);
    window.scrollTo(0, startY + (targetY - startY) * easeInOutQuad(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * In-page section nav for the About Company page — sticky vertical list on tablet/desktop,
 * sticky horizontal scrollable tab bar on mobile (same list, same active-tracking, laid out
 * differently via CSS rather than two separate components/observers).
 *
 * Active section is tracked with IntersectionObserver, not a `scroll` listener, per the
 * brief's performance guidance.
 */
export function AboutNav({ sections }: { sections: AboutSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      // Narrow band near the top of the viewport (just under the sticky header) — a
      // section "becomes active" when its heading crosses that band, not merely when
      // any part of it is visible.
      { rootMargin: `-${SCROLL_OFFSET_PX + 8}px 0px -70% 0px`, threshold: 0 },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    history.replaceState(null, "", `#${id}`);
    scrollToSection(id);
    setActive(id);
  }

  return (
    <nav
      aria-label="About Company sections"
      className={cn(
        "sticky top-0 z-10 -mx-5 flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur-sm",
        "lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none",
      )}
    >
      {sections.map((section) => {
        const isActive = active === section.id;
        return (
          <a
            key={section.id}
            ref={isActive ? activeTabRef : undefined}
            href={`#${section.id}`}
            aria-current={isActive ? "true" : undefined}
            onClick={(event) => handleClick(event, section.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-field px-4 py-2 text-body font-medium transition-colors duration-200 lg:whitespace-normal lg:rounded-none lg:border-l-2 lg:px-4 lg:py-2.5",
              isActive
                ? "bg-primary-50 text-primary-700 lg:border-l-primary-600 lg:bg-transparent lg:text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900 lg:border-l-transparent",
            )}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
