"use client";

import type { ProductionStep } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PRODUCTION_STEP_ICONS } from "./ProcessStepIcons";

const SCROLL_OFFSET_PX = 96;
const SCROLL_DURATION_MS = 600;
/** Where in the viewport a stage "activates" as the flowchart scrolls past — 0.45 biases
 * slightly above dead-center, matching AboutNav's activation band. */
const ACTIVATION_POINT = 0.45;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Same custom rAF smooth-scroll technique as AboutNav.scrollToSection — a fixed duration
 * and header-aware offset the native `scrollIntoView({behavior:"smooth"})` API can't give us.
 * Jumps instantly under prefers-reduced-motion instead of animating. */
function scrollToStage(id: string) {
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

/** Stable per-stage anchor id, derived from `icon` (not the free-text title, so a copy edit
 * never breaks a deep link) — deduped for the rare case two stages share an icon (e.g. right
 * after Duplicate). */
function useStageAnchorIds(steps: ProductionStep[]) {
  return useMemo(() => {
    const seen = new Map<string, number>();
    return steps.map((step) => {
      const base = `process-${step.icon}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return count === 0 ? base : `${base}-${count + 1}`;
    });
  }, [steps]);
}

/**
 * The interactive "Our Supply & Export Process" flowchart — shared by the Homepage section
 * and the standalone `/production-process` page (single source of truth, single component).
 *
 * Scroll behavior: a single passive `scroll` listener (rAF-throttled, mirrors
 * `DecorativeGraphics.tsx`'s parallax technique) computes how far the flowchart container has
 * progressed through the viewport and maps that 0–1 progress to an `activeIndex`. This drives
 * both layouts uniformly — horizontal on desktop, vertical on mobile — without per-node
 * IntersectionObservers, which would fire in lockstep on desktop's horizontal row (every node
 * sits at the same vertical scroll position there). No layout properties are ever animated
 * (only `background-color`/`box-shadow`/`transform`/`opacity`), and every stage's full content
 * stays in the DOM and readable regardless of animation state (items 53–56).
 */
export function ProcessFlowchart({ steps }: { steps: ProductionStep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageIds = useStageAnchorIds(steps);
  const reducedMotion = useReducedMotion();
  const [scrollActiveIndex, setActiveIndex] = useState(0);
  // Under reduced motion there's no scroll-driven reveal at all — every stage renders as
  // already-reached instead of animating toward that state (item 53: keep content readable,
  // remove the progressive animation, don't fade content in/out).
  const activeIndex = reducedMotion ? steps.length - 1 : scrollActiveIndex;

  useEffect(() => {
    if (reducedMotion) return;
    const el = containerRef.current;
    if (!el || steps.length === 0) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (el) {
          const rect = el.getBoundingClientRect();
          const progress = (window.innerHeight * ACTIVATION_POINT - rect.top) / Math.max(rect.height, 1);
          const clamped = Math.min(1, Math.max(0, progress));
          setActiveIndex(Math.min(steps.length - 1, Math.floor(clamped * steps.length)));
        }
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion, steps.length]);

  function handleStageClick(event: React.MouseEvent, id: string, index: number) {
    event.preventDefault();
    history.replaceState(null, "", `#${id}`);
    scrollToStage(id);
    setActiveIndex(index);
  }

  if (steps.length === 0) return null;

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-end">
        <span className="text-small font-medium tracking-wide text-neutral-500">
          {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
      </div>

      <ol className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[repeat(var(--stage-count),1fr)] lg:gap-5" style={{ "--stage-count": steps.length } as React.CSSProperties}>
        {steps.map((step, index) => {
          const Icon = PRODUCTION_STEP_ICONS[step.icon];
          const isActive = index === activeIndex;
          const isPassed = index < activeIndex;
          const isReached = isActive || isPassed;

          return (
            <li key={step.id} id={stageIds[index]} className="relative flex scroll-mt-28 gap-5 lg:flex-col lg:items-center lg:gap-4 lg:text-center">
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 top-7 hidden h-0.5 w-full transition-colors duration-500 lg:block",
                    isPassed ? "bg-primary-500" : "bg-neutral-200",
                  )}
                />
              )}

              <div className="flex shrink-0 flex-col items-center">
                <a
                  href={`#${stageIds[index]}`}
                  onClick={(event) => handleStageClick(event, stageIds[index], index)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-[transform,box-shadow,background-color,border-color,color] duration-500 ease-out",
                    isReached ? "border-primary-600 bg-primary-600 text-white" : "border-neutral-300 bg-white text-neutral-400",
                    isActive && "scale-105 shadow-[0_0_0_7px_rgba(47,107,69,0.14)]",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </a>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 w-0.5 flex-1 transition-colors duration-500 lg:hidden",
                      isPassed ? "bg-primary-500" : "bg-neutral-200",
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  "relative min-w-0 flex-1 overflow-hidden rounded-2xl border p-5 transition-[background-color,border-color,box-shadow,transform] duration-500 lg:flex-none lg:p-6 lg:text-center",
                  isReached ? "border-primary-200/80 bg-white/80 backdrop-blur-sm" : "border-neutral-200/80 bg-white/40",
                  isActive && "border-primary-400/80 shadow-[0_18px_55px_-20px_rgba(139,194,54,0.55)] lg:-translate-y-1",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-primary-500/30 via-primary-400/10 to-accent-500/10 blur-2xl transition-opacity duration-700",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="relative">
                  <p className={cn("text-small font-semibold uppercase tracking-wide", isReached ? "text-primary-700" : "text-neutral-400")}>
                    {String(index + 1).padStart(2, "0")}
                    {step.label && <span className="ml-1.5">{step.label}</span>}
                  </p>
                  <h3 className={cn("mt-1 text-body-lg font-medium lg:text-h3", isReached ? "text-neutral-900" : "text-neutral-400")}>
                    {step.title}
                  </h3>
                  <p className={cn("mt-1.5 text-body", isReached ? "text-neutral-600" : "text-neutral-400")}>{step.description}</p>
                  {step.illustration && (
                    <div className="relative mt-4 aspect-video overflow-hidden rounded-card lg:aspect-4/3">
                      <SafeImage media={step.illustration} sizes="(min-width: 1024px) 20vw, 90vw" />
                    </div>
                  )}
                  {step.cta_label && step.cta_href && (
                    <Link href={step.cta_href} className="mt-3 inline-block text-small font-medium text-primary-700 underline">
                      {step.cta_label}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
