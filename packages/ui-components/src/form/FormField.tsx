import { ReactNode } from "react";
import { cn } from "../utils/cn";
import { Label } from "./Label";
import { FieldError } from "./FieldError";

export interface FormFieldProps {
  label?: ReactNode;
  /** Must match the `id` on whatever control is passed as `children` — the same
   * Label-`htmlFor`-plus-Input-`id` pairing already used across every existing admin form,
   * not a new convention. */
  htmlFor?: string;
  required?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Label + description + control + error, in that order — the exact structure already
 * hand-assembled on every admin form field, just named and reusable. Works with any control
 * (`Input`, `Textarea`, `Select`, an upload field, a custom widget) since it never touches
 * `children` — it only wraps it.
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  description,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn(className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </Label>
      )}
      {description && <p className="-mt-1 mb-1.5 text-small text-neutral-500">{description}</p>}
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
