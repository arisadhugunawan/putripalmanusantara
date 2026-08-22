import type { AboutCompanySectionStatus } from "@ppn/shared-types";
import { ABOUT_COMPANY_SECTION_STATUS_LABELS } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";

/**
 * Explicit section status — Published / Draft / Hidden only. Never a vague "Running" or
 * "Processing": in-flight states are the job of `SaveStateIndicator`, and this badge always
 * describes what the *public site* currently shows for this section.
 */
const STATUS_CLASSES: Record<AboutCompanySectionStatus, string> = {
  published: "bg-primary-100 text-primary-700",
  draft: "bg-amber-100 text-amber-900",
  hidden: "bg-neutral-100 text-neutral-600",
};

const STATUS_DOTS: Record<AboutCompanySectionStatus, string> = {
  published: "●",
  draft: "●",
  hidden: "○",
};

export function AboutCompanySectionStatusBadge({ status }: { status: AboutCompanySectionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-small font-medium",
        STATUS_CLASSES[status],
      )}
    >
      <span aria-hidden="true">{STATUS_DOTS[status]}</span>
      {ABOUT_COMPANY_SECTION_STATUS_LABELS[status]}
    </span>
  );
}
