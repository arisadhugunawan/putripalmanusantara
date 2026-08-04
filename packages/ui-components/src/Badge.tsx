import { HTMLAttributes } from "react";
import { cn } from "./utils/cn";

export type BadgeVariant = "neutral" | "primary" | "accent";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-900",
  primary: "bg-primary-50 text-primary-700",
  // docs/03-design.md §2 — secondary yellow used sparingly, e.g. small badges.
  accent: "bg-secondary-500/15 text-neutral-900",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-small font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
