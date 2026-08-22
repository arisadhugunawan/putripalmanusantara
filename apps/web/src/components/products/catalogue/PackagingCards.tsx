import type { ProductPackagingApplication } from "@ppn/shared-types";
import Image from "next/image";
import { PackagingIcon, packagingIconPatternFor } from "./PackagingIcon";

/**
 * Section 7 "Packaging" — compact chip-style cards, not full-width photo cards: the image is a
 * small, clearly-legible thumbnail (matching the redesign brief's "small but clear" spec, not a
 * "giant card"). A real CMS photo shows when the Admin has uploaded one; otherwise a clean
 * icon (keyword-matched from the real title, same convention as ApplicationCards' `iconFor()`)
 * stands in — never a fabricated stock photo.
 */
export function PackagingCards({ items }: { items: ProductPackagingApplication[] }) {
  return (
    <div className="flex flex-wrap gap-5 sm:gap-6">
      {items.map((item) => (
        <div key={item.id} className="group flex w-[6.5rem] flex-col items-center gap-2 text-center sm:w-40">
          <div className="relative h-[5.6rem] w-[5.6rem] shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-premium sm:h-32 sm:w-32">
            {item.media && item.media.file_type === "image" ? (
              <Image
                src={item.media.file_url}
                alt={item.media.alt_text}
                fill
                sizes="(min-width: 640px) 128px, 90px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-700">
                <PackagingIcon pattern={packagingIconPatternFor(item.title)} />
              </div>
            )}
          </div>
          <div>
            <p className="text-small font-medium text-neutral-900">{item.title}</p>
            {item.description && <p className="mt-0.5 text-small text-neutral-500">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
