import { ReactNode } from "react";
import { cn } from "./utils/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Smaller padding/type for use inside an already-bordered container (e.g. a table cell)
   * instead of as its own standalone block. */
  compact?: boolean;
  className?: string;
}

/**
 * One "nothing here yet" block — dashed border, centered text, optional action — replacing the
 * 41+ independently hand-written empty-state paragraphs across the admin (`Belum ada ...`,
 * `No ... found`), which shared this exact `rounded-field border border-dashed
 * border-neutral-300 p-8 text-center` styling by convention already, just never as one component.
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-field border border-dashed border-neutral-300 text-center",
        compact ? "gap-1 p-4" : "gap-2 p-8",
        className,
      )}
    >
      {icon && (
        <div className={cn("text-neutral-400", compact ? "text-h3" : "text-h1")} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={cn("font-medium text-neutral-900", compact ? "text-small" : "text-body")}>{title}</p>
      {description && <p className="max-w-sm text-small text-neutral-500">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
