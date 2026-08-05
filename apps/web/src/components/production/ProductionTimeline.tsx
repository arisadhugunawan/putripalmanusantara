import { cn } from "@ppn/ui-components";
import type { ProductionStep } from "@ppn/shared-types";
import { SafeImage } from "@/components/SafeImage";

/**
 * docs/03-design.md §5.5 — horizontal stepper with connecting line on desktop, vertical
 * stepper on mobile. FR-PROC-01/02/03.
 */
export function ProductionTimeline({
  steps,
  compact = false,
}: {
  steps: ProductionStep[];
  compact?: boolean;
}) {
  return (
    <ol className="grid grid-cols-1 gap-8 lg:grid-cols-[repeat(var(--steps),1fr)] lg:gap-4" style={{ "--steps": steps.length } as React.CSSProperties}>
      {steps.map((step, index) => (
        <li key={step.id} className="relative flex gap-4 lg:flex-col lg:gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-body font-heading font-bold text-neutral-900">
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <span
                className="mt-1 w-0.5 flex-1 bg-neutral-200 lg:absolute lg:top-5 lg:left-1/2 lg:h-0.5 lg:w-full lg:flex-none lg:bg-neutral-200"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="pb-2 lg:text-center">
            {!compact && (
              <div className="relative mb-3 hidden aspect-square w-full overflow-hidden rounded-card sm:block lg:block">
                <SafeImage media={step.illustration} />
              </div>
            )}
            <h3 className={cn("text-h3 text-neutral-900", compact && "text-body-lg font-medium")}>
              {step.title}
            </h3>
            <p className="mt-1 text-body text-neutral-600">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
