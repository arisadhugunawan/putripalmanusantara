import { cn } from "@ppn/ui-components";

/**
 * Neutral shimmer block used while Admin content loads — never a blank layout (README
 * "About Company Manager"). `aria-hidden` because the surrounding region already announces
 * its busy state via `aria-busy`; the bars themselves carry no information.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-neutral-200", className)} />;
}

/** Card-shaped placeholder matching the `Card` + heading + field-rows rhythm of the editors. */
export function SkeletonCard({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("rounded-card border border-neutral-200 bg-white p-6", className)} aria-busy="true">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
      <div className="mt-5 flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder for a list of media/team/document rows (thumbnail + two text lines). */
export function SkeletonListRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-4 rounded-field border border-neutral-200 p-3">
          <Skeleton className="h-20 w-32 shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
