"use client";

import type { HomepageWhyChooseUsIcon } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";
import { WHY_CHOOSE_US_ICONS } from "./WhyChooseUsIcons";

/** How long the green "active" border/icon/background lingers after a click before fading
 * back out — longer than the 450ms pulse itself so the pulse reads as the primary feedback,
 * but still brief (never a permanent glow). */
const ACTIVE_LINGER_MS = 900;

/**
 * A single "Why Choose Us?" card — icon + short title only, no description (see
 * WhyChooseUsSection.tsx). Click triggers a one-shot ~450ms pulse/heartbeat (card + icon
 * scale, brief green glow via the `card-pulse`/`icon-pulse` keyframes in globals.css);
 * hover (desktop) lifts the card and strengthens the border/icon/background. A `<button>`
 * is used so keyboard focus and activation (Enter/Space) work natively, no extra
 * role/tabIndex wiring needed.
 */
export function WhyChooseUsCard({
  icon,
  title,
  visible,
  delayMs,
}: {
  icon: HomepageWhyChooseUsIcon;
  title: string;
  visible: boolean;
  delayMs: number;
}) {
  const [pulsing, setPulsing] = useState(false);
  const [active, setActive] = useState(false);
  const lingerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = WHY_CHOOSE_US_ICONS[icon];

  useEffect(() => {
    return () => {
      if (lingerTimeout.current) clearTimeout(lingerTimeout.current);
    };
  }, []);

  function handleActivate() {
    setPulsing(true);
    setActive(true);
    if (lingerTimeout.current) clearTimeout(lingerTimeout.current);
    lingerTimeout.current = setTimeout(() => setActive(false), ACTIVE_LINGER_MS);
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      onAnimationEnd={() => setPulsing(false)}
      aria-label={title}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
      className={cn(
        "group flex min-h-[124px] w-full flex-col items-center justify-center gap-3 rounded-[16px] border bg-white px-3 py-6 text-center",
        "transition-[opacity,transform,box-shadow,background-color,border-color] duration-[220ms] ease-out",
        "shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        active
          ? "border-primary-500 bg-primary-50"
          : "border-primary-100 hover:border-primary-300 hover:bg-primary-50/50",
        pulsing && "animate-card-pulse",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full text-primary-700",
          "transition-transform duration-[220ms] ease-out group-hover:scale-110",
          pulsing && "animate-icon-pulse",
        )}
      >
        <Icon className="h-7 w-7" />
      </span>
      <span className="text-small font-semibold uppercase tracking-wide text-neutral-900">{title}</span>
    </button>
  );
}
