import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  /** Rendered as a disabled, unselectable first option — omit if the field always has a real default. */
  placeholder?: string;
  invalid?: boolean;
}

/**
 * A native `<select>` — deliberately not a custom dropdown widget. Native selects already give
 * keyboard navigation, screen-reader semantics, and mobile picker UI for free; a custom
 * listbox would have to reimplement all of that. Consolidates the ~38 independently-styled raw
 * `<select>` elements across the admin into one visual definition, matching `Input`/`Textarea`.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, invalid = false, className, required, ...props }, ref) => {
    return (
      <select
        ref={ref}
        required={required}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-field border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-900",
          "transition-colors duration-150",
          "focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100",
          invalid && "border-red-400 focus:border-red-500 focus:ring-red-100",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden={required}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
);
Select.displayName = "Select";
