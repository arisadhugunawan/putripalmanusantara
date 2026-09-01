import type { ShipmentScheduleStep } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { SHIPMENT_ICONS } from "./ShipmentIcons";

/** Compact "Shipping Schedule" mini-timeline — same icon-circle + connecting-line structure as
 * `ProductionTimeline.tsx` (already used just above this section on the same page), scaled
 * down and swapping the number badge for an icon. */
export function ShipmentScheduleTimeline({
  steps,
  title = "Shipping Schedule",
  subtitle = "Product Availability + Order Volume + Vessel Schedule",
}: {
  steps: ShipmentScheduleStep[];
  title?: string;
  subtitle?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="text-h3 text-neutral-900">{title}</h3>
      <p className="mt-1 text-small text-neutral-600">{subtitle}</p>
      <ol
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[repeat(var(--steps),1fr)] lg:gap-3"
        style={{ "--steps": steps.length } as React.CSSProperties}
      >
        {steps.map((step, index) => {
          const Icon = SHIPMENT_ICONS[step.icon];
          return (
            <li key={step.id} className="relative flex gap-3 lg:flex-col lg:items-center lg:gap-2 lg:text-center">
              <div className="flex flex-col items-center lg:w-full">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-primary-50 text-primary-700">
                  <Icon className="h-4 w-4" />
                </span>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 w-0.5 flex-1 bg-neutral-200",
                      "lg:absolute lg:top-5 lg:left-1/2 lg:h-0.5 lg:w-full lg:flex-none",
                    )}
                  />
                )}
              </div>
              <div className="pb-1">
                <p className="text-small font-medium text-neutral-900">{step.name}</p>
                {step.description && <p className="mt-0.5 text-small text-neutral-600">{step.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
