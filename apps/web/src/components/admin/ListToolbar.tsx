"use client";

import { cn, Input } from "@ppn/ui-components";

export type ActiveFilter = "all" | "active" | "inactive";
export type SortKey = "order" | "name";

const ACTIVE_FILTERS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/**
 * Search + Active/Inactive filter + sort selector shared by the About Company item editors
 * (team, activities, documents, factory gallery). Purely presentational: the owning editor
 * keeps the state and applies it, since each list filters on different fields.
 */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  activeFilter,
  onActiveFilterChange,
  sort,
  onSortChange,
  resultCount,
  totalCount,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  activeFilter: ActiveFilter;
  onActiveFilterChange: (value: ActiveFilter) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  resultCount: number;
  totalCount: number;
  /** Extra list-specific filter controls (e.g. document type) rendered next to the chips. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-field border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="sm:max-w-sm"
        />
        <label className="flex items-center gap-2 text-small text-neutral-600">
          Urutkan
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="rounded-field border border-neutral-300 bg-white px-3 py-2 text-small"
          >
            <option value="order">Display Order</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ACTIVE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={activeFilter === filter.value}
            onClick={() => onActiveFilterChange(filter.value)}
            className={cn(
              "rounded-button border px-3 py-1 text-small transition-colors",
              activeFilter === filter.value
                ? "border-primary-600 bg-primary-100 text-primary-700"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            {filter.label}
          </button>
        ))}
        {children}
        <span className="ml-auto text-small text-neutral-500">
          {resultCount} dari {totalCount}
        </span>
      </div>
    </div>
  );
}
