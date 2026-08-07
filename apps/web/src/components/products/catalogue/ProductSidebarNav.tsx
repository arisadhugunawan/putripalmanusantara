"use client";

import type { ProductSummary } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/Link";

/**
 * Product catalogue navigation — sticky vertical list on desktop/tablet, horizontal
 * scrollable tab bar on mobile. Unlike AboutNav (which scrolls within one page), this
 * navigates between distinct /products/[slug] routes.
 */
export function ProductSidebarNav({
  products,
  currentSlug,
  eyebrow,
}: {
  products: ProductSummary[];
  currentSlug: string;
  eyebrow: string;
}) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [currentSlug]);

  return (
    <nav
      aria-label={eyebrow}
      className={cn(
        "sticky top-0 z-10 -mx-5 flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur-sm",
        "lg:sticky lg:top-24 lg:mx-0 lg:block lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none",
      )}
    >
      <p className="hidden text-small font-medium uppercase tracking-wide text-neutral-500 lg:block">
        {eyebrow}
      </p>
      <ul className="flex gap-1 lg:mt-4 lg:flex-col lg:gap-0.5">
        {products.map((product) => {
          const isActive = product.slug === currentSlug;
          return (
            <li key={product.id} className="shrink-0 lg:shrink">
              <Link
                ref={isActive ? activeRef : undefined}
                href={`/products/${product.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block shrink-0 whitespace-nowrap rounded-field px-4 py-2 text-body font-medium transition-colors duration-200 lg:whitespace-normal lg:rounded-none lg:border-l-2 lg:px-4 lg:py-2.5",
                  isActive
                    ? "bg-primary-50 text-primary-700 lg:border-l-primary-600 lg:bg-transparent lg:text-primary-700"
                    : "text-neutral-600 hover:text-neutral-900 lg:border-l-transparent",
                )}
              >
                {product.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
