import { HTMLAttributes } from "react";
import { cn } from "./utils/cn";

export type SectionTone = "default" | "soft";
export type SectionSpacing = "compact" | "default" | "comfortable";

const TONE_CLASSES: Record<SectionTone, string> = {
  default: "bg-white",
  // docs/03-design.md §2.1 — soft tint background, used sparingly for section variety.
  soft: "bg-primary-50",
};

// Fluid clamp() tokens defined in globals.css — see the comment there for the full rationale.
const SPACING_CLASSES: Record<SectionSpacing, string> = {
  compact: "py-(--spacing-section-y-compact)",
  default: "py-(--spacing-section-y)",
  comfortable: "py-(--spacing-section-y-comfortable)",
};

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  spacing?: SectionSpacing;
}

/** Vertical section spacing — docs/03-design.md §4 (96–120px desktop, 56–72px mobile), now a
 * fluid clamp() scale instead of a single breakpoint jump. */
export function Section({ tone = "default", spacing = "default", className, ...props }: SectionProps) {
  return (
    <section
      className={cn(SPACING_CLASSES[spacing], TONE_CLASSES[tone], className)}
      {...props}
    />
  );
}
