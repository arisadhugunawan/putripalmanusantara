"use client";

import type { Media } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useState } from "react";

/**
 * Header/Footer/Mobile logo — `object-contain` inside a fixed-size box (never stretched or
 * cropped, per README "Brand & Logo"). Falls back to the "PPN" text wordmark (same pattern as
 * `PartnerLogoTile`) if the asset fails to load at runtime, never a broken-image icon.
 */
export function BrandLogoImage({
  media,
  altText,
  className,
  sizes,
  priority,
  fallbackClassName = "text-neutral-900",
}: {
  media: Media;
  altText: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Text color for the "PPN" fallback shown on load failure — the default (dark text) is
   * right on the light Header/mobile drawer; pass "text-white" for the dark Footer. */
  fallbackClassName?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className={cn("flex items-center", className)}>
        <span className={cn("font-heading font-bold", fallbackClassName)}>PPN</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Image
        src={media.file_url}
        alt={altText}
        fill
        sizes={sizes ?? "220px"}
        priority={priority}
        className="object-contain"
        onError={() => setBroken(true)}
      />
    </div>
  );
}
