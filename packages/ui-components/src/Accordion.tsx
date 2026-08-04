"use client";

import { useId, useState } from "react";
import { cn } from "./utils/cn";

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: AccordionItemData[];
  /** Only one panel open at a time — docs/03-design.md §5.6, FR-FAQ-02. */
  singleOpen?: boolean;
  className?: string;
}

export function Accordion({ items, singleOpen = true, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const baseId = useId();

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = singleOpen ? new Set<string>() : new Set(prev);
      if (prev.has(id)) {
        if (!singleOpen) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className={cn("divide-y divide-neutral-200 border-y border-neutral-200", className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${baseId}-panel-${item.id}`;
        const buttonId = `${baseId}-button-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-body-lg font-medium text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                >
                  <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-current" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-body text-neutral-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
