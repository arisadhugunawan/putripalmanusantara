"use client";

import { useEffect, useRef, useState } from "react";

/** Splits "1,200+ containers" style values into an animatable number plus prefix/suffix text. */
function parseValue(value: string) {
  const match = /^(\D*)([\d,]+(?:\.\d+)?)(.*)$/.exec(value.trim());
  if (!match) return { prefix: "", number: null as number | null, suffix: value, decimals: 0 };
  const [, prefix, numberPart, suffix] = match;
  const number = Number(numberPart.replace(/,/g, ""));
  if (Number.isNaN(number)) return { prefix: "", number: null as number | null, suffix: value, decimals: 0 };
  return { prefix, number, suffix, decimals: numberPart.includes(".") ? numberPart.split(".")[1].length : 0 };
}

/** Count-up animation on scroll into view — docs/03-design.md §5.4, §7 (1–1.5s). */
export function StatCounter({ value }: { value: string }) {
  const parsed = parseValue(value);
  const ref = useRef<HTMLSpanElement>(null);
  // null = not yet animated (render the static starting value below); set only from
  // IntersectionObserver/rAF callbacks, never synchronously in the effect body.
  const [animated, setAnimated] = useState<string | null>(null);

  useEffect(() => {
    if (parsed.number === null) return;
    const { prefix, number, suffix, decimals } = parsed;
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const durationMs = 1200;
        const start = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - start) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = number * eased;
          const formatted = current.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
          setAnimated(`${prefix}${formatted}${suffix}`);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const initialDisplay = parsed.number === null ? value : `${parsed.prefix}0${parsed.suffix}`;

  return (
    <span ref={ref} className="tabular-nums">
      {animated ?? initialDisplay}
    </span>
  );
}
