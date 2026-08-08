"use client";

import type { HomepageWhyChooseUs } from "@ppn/shared-types";
import { useEffect, useRef, useState } from "react";
import { WhyChooseUsCard } from "./WhyChooseUsCard";

/** Per-card entry-animation stagger — within the brief's 50-80ms range. */
const STAGGER_MS = 60;

/**
 * Responsive grid + one-time scroll-triggered stagger for the "Why Choose Us?" cards:
 * mobile 2 columns (4 rows), tablet 4 columns (2 rows), desktop 8 columns (single row).
 * A single IntersectionObserver (not one per card) flips `visible` once the grid enters the
 * viewport; each card reads its own `transitionDelay` from its index for the stagger, same
 * transform+opacity technique as FadeUpSection.tsx.
 */
export function WhyChooseUsGrid({ items }: { items: HomepageWhyChooseUs[] }) {
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
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 lg:grid-cols-8">
      {items.map((item, index) => (
        <WhyChooseUsCard
          key={item.id}
          icon={item.icon}
          title={item.title}
          visible={visible}
          delayMs={index * STAGGER_MS}
        />
      ))}
    </div>
  );
}
