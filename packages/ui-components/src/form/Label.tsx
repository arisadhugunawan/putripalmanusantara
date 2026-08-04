import { LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("block text-small font-medium text-neutral-900 mb-1.5", className)}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";
