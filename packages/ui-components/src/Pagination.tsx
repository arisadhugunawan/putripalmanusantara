import { ReactNode } from "react";
import { cn } from "./utils/cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** e.g. "24 of 160 files" — purely display, Pagination never talks to an API itself. */
  summary?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}

/**
 * Prev/current/Next — the exact shape every paginated admin list (Media Library, Activity Log)
 * already hand-rolls identically. No numbered page-jump buttons, since none of those existing
 * pages have them either — this standardizes what's already agreed on, not a new UX. Knows
 * nothing about how pages are fetched; the caller owns `page` state and the actual request.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  summary,
  previousLabel = "Prev",
  nextLabel = "Next",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-6 flex items-center justify-center gap-3", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
      >
        {previousLabel}
      </button>
      <span className="text-small text-neutral-500" aria-live="polite">
        {summary ?? `${page} / ${totalPages}`}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
      >
        {nextLabel}
      </button>
    </nav>
  );
}
