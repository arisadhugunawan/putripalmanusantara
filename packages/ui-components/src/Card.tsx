import { HTMLAttributes, forwardRef } from "react";
import { cn } from "./utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the hover elevation + shadow transition from docs/03-design.md §5.2. */
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-card bg-white shadow-card p-6",
          hoverable &&
            "transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-card-hover",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";
