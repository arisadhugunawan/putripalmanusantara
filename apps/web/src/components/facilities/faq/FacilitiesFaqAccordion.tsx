"use client";

import type { FacilitiesFaqItem } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";
import { PlusIcon, resolveFaqItemIcon } from "./FacilitiesFaqIcons";

/**
 * The redesigned FAQ accordion. Height animation uses the CSS grid-rows technique
 * (`grid-template-rows: 0fr` → `1fr` on a wrapping grid, inner `overflow-hidden` content) — a
 * pure-CSS, GPU-friendly way to animate to "auto" height with no JS measurement. Single-open
 * (`accordionMode === "single"`) closes any other open row when one opens; multiple-open keeps
 * every row independent. Reveal is one-shot on first scroll into view (same
 * `IntersectionObserver` pattern as `FadeUpSection`), staggered 50/80/110/140...ms per row —
 * never repeats on subsequent scrolls.
 */
export function FacilitiesFaqAccordion({
  items,
  accordionMode,
}: {
  items: FacilitiesFaqItem[];
  accordionMode: "single" | "multiple";
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const isOpen = prev.has(id);
      if (accordionMode === "single") {
        return isOpen ? new Set() : new Set([id]);
      }
      const next = new Set(prev);
      if (isOpen) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="flex flex-col divide-y divide-neutral-200 border-t border-neutral-200">
      {items.map((item, index) => {
        const isOpen = openIds.has(item.id);
        const number = String(index + 1).padStart(2, "0");
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-question-${item.id}`;
        const Icon = resolveFaqItemIcon(item.icon);
        const tagsText = item.tags.map((t) => t.name).join(", ");

        return (
          <div
            key={item.id}
            className={cn(
              "relative transition-[opacity,transform] duration-500 ease-out",
              revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
            style={{ transitionDelay: revealed ? `${50 + index * 30}ms` : undefined }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-0.5 bg-primary-600 transition-transform duration-300 ease-out"
              style={{ transform: `scaleY(${isOpen ? 1 : 0})`, transformOrigin: "top" }}
            />
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full min-h-11 items-start gap-4 py-5 pl-5 pr-3 text-left transition-[transform,background-color] duration-300 ease-out",
                  "lg:hover:translate-x-1 lg:hover:bg-primary-50",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 font-heading text-[2.5rem] leading-none transition-colors duration-300 lg:text-[3rem]",
                    isOpen ? "text-primary-600" : "text-neutral-300",
                  )}
                >
                  {number}
                </span>
                <span className="min-w-0 flex-1 pt-1">
                  <span
                    className={cn(
                      "block text-body-lg transition-[color,font-weight] duration-300",
                      isOpen ? "font-semibold text-neutral-900" : "font-medium text-neutral-800",
                    )}
                  >
                    {item.question}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-transform duration-300 ease-out",
                    isOpen && "border-primary-600 text-primary-600",
                  )}
                  style={{ transform: isOpen ? "rotate(45deg)" : undefined }}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "flex flex-col gap-3 pb-6 pl-5 pr-3 transition-opacity duration-[400ms] sm:pl-[4.5rem]",
                    isOpen ? "opacity-100 delay-150" : "opacity-0",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                    <p className="text-body text-neutral-600">{item.answer}</p>
                  </div>

                  {item.highlight_text && (
                    <span className="inline-flex w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-small font-semibold uppercase tracking-wide text-primary-800">
                      {item.highlight_text}
                    </span>
                  )}

                  {item.tags.length > 0 && (
                    <>
                      <div className="hidden flex-wrap gap-2 sm:flex">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-small font-medium text-primary-800"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-small text-neutral-500 sm:hidden">{tagsText}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
