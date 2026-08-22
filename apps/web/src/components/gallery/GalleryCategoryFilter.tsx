"use client";

import { cn } from "@ppn/ui-components";
import type { GalleryCategory } from "@ppn/shared-types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Pill filter bar for the masonry grid below — reuses the exact active/inactive visual
 * convention already established by the site's other pill filters (`bg-primary-500
 * text-neutral-900` active / `bg-neutral-100 text-neutral-600` inactive). Syncs the selection
 * to `?category=slug` via a shallow `router.replace` (no scroll, no full navigation) so the
 * filter is shareable/bookmarkable without leaving the client-rendered grid below it. */
export function GalleryCategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: GalleryCategory[];
  active: string;
  onChange: (slug: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = useCallback(
    (slug: string) => {
      onChange(slug);
      const params = new URLSearchParams(searchParams.toString());
      if (slug === "all") params.delete("category");
      else params.set("category", slug);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [onChange, pathname, router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => select("all")}
        aria-pressed={active === "all"}
        className={cn(
          "rounded-button px-4 py-2 text-body font-medium transition-colors",
          active === "all" ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => select(category.slug)}
          aria-pressed={active === category.slug}
          className={cn(
            "rounded-button px-4 py-2 text-body font-medium transition-colors",
            active === category.slug
              ? "bg-primary-500 text-neutral-900"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
