import { HTMLAttributes } from "react";
import { cn } from "./utils/cn";

export type SectionTone = "default" | "soft";

const TONE_CLASSES: Record<SectionTone, string> = {
  default: "bg-white",
  // docs/03-design.md §2.1 — soft tint background, used sparingly for section variety.
  soft: "bg-primary-50",
};

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
}

/** Vertical section spacing — docs/03-design.md §4 (96–120px desktop, 56–72px mobile). */
export function Section({ tone = "default", className, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-14 md:py-24", TONE_CLASSES[tone], className)}
      {...props}
    />
  );
}
