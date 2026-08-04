import { HTMLAttributes } from "react";
import { cn } from "./utils/cn";

/** Grid container widths — docs/03-design.md §4. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-(--container-page) 2xl:max-w-(--container-page-lg) px-5 sm:px-8",
        className,
      )}
      {...props}
    />
  );
}
