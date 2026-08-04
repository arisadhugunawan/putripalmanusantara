import { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

/** Clear, specific field-level error message — FR-CONTACT-04 / FR-QUOTE-03. */
export function FieldError({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p role="alert" className={cn("mt-1.5 text-small text-red-600", className)} {...props}>
      {children}
    </p>
  );
}
