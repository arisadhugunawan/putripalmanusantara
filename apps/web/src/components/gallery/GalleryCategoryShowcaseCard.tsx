"use client";

import type { Media } from "@ppn/shared-types";
import { SafeImage } from "@/components/SafeImage";
import { GalleryCategoryEmptyState } from "./GalleryEmptyState";

/** One panel of the horizontal category journey — large preview image, number, name, short
 * description, item count, and a "View Gallery" jump to that category's filtered grid below.
 * `previewImage` is always a real photo (a category's own item, or — for the Products/Team
 * virtual categories — a real product cover/team photo), never a placeholder; when a real
 * category has zero items yet, the empty state renders instead of a broken/missing image. */
export function GalleryCategoryShowcaseCard({
  index,
  name,
  description,
  previewImage,
  itemCount,
  onView,
}: {
  index: number;
  name: string;
  description?: string;
  previewImage: Media | null;
  itemCount: number;
  onView: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_-30px_rgba(24,61,43,0.35)]">
      <div className="relative aspect-4/3 w-full shrink-0">
        {previewImage || itemCount > 0 ? (
          <SafeImage media={previewImage} sizes="(min-width: 1024px) 60vw, 90vw" />
        ) : (
          <div className="absolute inset-0 p-4">
            <GalleryCategoryEmptyState categoryName={name} />
          </div>
        )}
        <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-small font-semibold text-primary-800 shadow-sm">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-h3 text-neutral-900">{name}</h3>
        {description && <p className="mt-2 text-body text-neutral-600">{description}</p>}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-small text-neutral-500">
            {itemCount > 0 ? `${itemCount} photo${itemCount === 1 ? "" : "s"}` : "Coming soon"}
          </span>
          <button
            type="button"
            onClick={onView}
            disabled={itemCount === 0}
            className="text-small font-semibold text-primary-700 underline-offset-4 hover:underline disabled:cursor-default disabled:text-neutral-400 disabled:no-underline"
          >
            View Gallery →
          </button>
        </div>
      </div>
    </div>
  );
}
