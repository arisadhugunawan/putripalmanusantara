import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // docs/03-design.md §5.1 — Primary: bg primary green, hover darkens.
  primary:
    "bg-primary-500 text-neutral-900 hover:bg-primary-600 focus-visible:outline-primary-700",
  // Secondary: outline with neutral/brown border, transparent background.
  secondary:
    "border border-neutral-300 text-neutral-900 bg-transparent hover:border-accent-500 hover:text-accent-600 focus-visible:outline-neutral-600",
  // Ghost / text link: underline animates in on hover.
  ghost:
    "bg-transparent text-neutral-900 underline decoration-transparent hover:decoration-current underline-offset-4 focus-visible:outline-neutral-600 px-0",
};

const SIZE_CLASSES: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: {
    sm: "text-small px-4 py-2",
    md: "text-body px-6 py-3",
    lg: "text-body-lg px-8 py-4",
  },
  secondary: {
    sm: "text-small px-4 py-2",
    md: "text-body px-6 py-3",
    lg: "text-body-lg px-8 py-4",
  },
  ghost: {
    sm: "text-small",
    md: "text-body",
    lg: "text-body-lg",
  },
};

export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
    variant !== "ghost" && "rounded-button",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[variant][size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button ref={ref} className={buttonVariants(variant, size, className)} {...props} />
    );
  },
);
Button.displayName = "Button";
