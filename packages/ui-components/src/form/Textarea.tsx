import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-field border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-900",
          "placeholder:text-neutral-600 transition-colors duration-150 resize-y",
          "focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100",
          invalid && "border-red-400 focus:border-red-500 focus:ring-red-100",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
