import { HTMLAttributes, ReactNode } from "react";
import { cn } from "./utils/cn";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** `<thead>`/`<tbody>` — plain native table markup, not a parallel component API. Table only
   * standardizes the wrapper (horizontal-scroll container, base classes), the same wrapper
   * every admin list table already hand-writes around a completely ordinary `<table>`. */
  children: ReactNode;
  wrapperClassName?: string;
}

/**
 * Presentational only — no sorting, filtering, or pagination logic. A list page decides what
 * rows to pass in and renders `Pagination` separately alongside it, exactly like the existing
 * Media Library / Activity Log pages already do; `Table` just standardizes the markup those
 * pages already agree on.
 */
export function Table({ children, className, wrapperClassName, ...props }: TableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-card border border-neutral-100 bg-white shadow-card", wrapperClassName)}>
      <table className={cn("w-full text-body", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

/** A full-width row for "no data" inside a table that already has a header — pass the real
 * column count so the cell spans correctly. For a page with no table shell at all, use
 * `EmptyState` directly instead. */
export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center text-small text-neutral-500">
        {children}
      </td>
    </tr>
  );
}
