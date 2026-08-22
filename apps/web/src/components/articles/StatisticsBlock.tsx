"use client";

import type { ArticleStatistic } from "@ppn/shared-types";
import { useEffect, useRef, useState } from "react";

const COUNT_UP_MS = 900;

/** Parses a leading numeric run out of e.g. "+20", "2,800+", "100%" — returns null when the
 * value isn't count-up-able (e.g. plain text), in which case the raw string is shown statically
 * instead of animating (brief item 23: "Use animated count-up only when appropriate"). */
function parseNumeric(value: string): { number: number; prefix: string; suffix: string } | null {
  const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!match) return null;
  const number = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(number)) return null;
  return { number, prefix: match[1], suffix: match[3] };
}

function StatValue({ value }: { value: string }) {
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(parsed ? 0 : null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!parsed) return;
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (reduceMotion) {
          setDisplay(parsed.number);
          return;
        }
        const target = parsed.number;
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / COUNT_UP_MS);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!parsed) return <>{value}</>;
  return (
    <span ref={ref}>
      {parsed.prefix}
      {(display ?? 0).toLocaleString("en-US")}
      {parsed.suffix}
    </span>
  );
}

/** Brief item 23 "Insight Numbers" — Admin-controlled (`Article.statistics`), values are never
 * fabricated here: whatever the Admin enters is shown verbatim, only the reveal is animated. */
export function StatisticsBlock({ statistics }: { statistics: ArticleStatistic[] }) {
  if (statistics.length === 0) return null;

  return (
    <div className="my-10 grid grid-cols-2 gap-6 rounded-card bg-neutral-50 p-6 sm:grid-cols-4 sm:p-8">
      {statistics.map((stat, index) => (
        <div key={index} className="text-center">
          <p className="font-heading text-h2 text-primary-700">
            <StatValue value={stat.value} />
          </p>
          <p className="mt-1 text-small uppercase tracking-wide text-neutral-600">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
