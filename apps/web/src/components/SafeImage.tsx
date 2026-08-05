import { cn } from "@ppn/ui-components";
import Image from "next/image";
import type { Media } from "@ppn/shared-types";

/**
 * Renders CMS media when present, or an on-brand placeholder otherwise — never a broken
 * image icon (docs/07-user-flow.md §9: "Artikel/produk belum memiliki gambar dari CMS").
 */
export function SafeImage({
  media,
  className,
  sizes,
  fill = true,
  priority,
}: {
  media: Media | null | undefined;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
}) {
  if (media && media.file_type === "image") {
    return (
      <Image
        src={media.file_url}
        alt={media.alt_text}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-linear-to-br from-primary-50 to-neutral-100",
        fill && "absolute inset-0",
        className,
      )}
      role="img"
      aria-label="Image coming soon"
    >
      <CoconutMark className="h-10 w-10 text-primary-600/40" />
    </div>
  );
}

function CoconutMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M9 8c0-2 1-4 3-5 2 1 3 3 3 5" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
