import type { ProductPackagingApplication } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { SafeImage } from "@/components/SafeImage";

/** Section 7 "Packaging" — image cards. Real CMS entries only; if the admin hasn't
 * uploaded a photo for an option yet, SafeImage's honest on-brand placeholder shows
 * instead of a fabricated image. */
export function PackagingCards({ items }: { items: ProductPackagingApplication[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} hoverable className="overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1">
          <div className="relative aspect-4/3 overflow-hidden">
            <SafeImage media={item.media} sizes="(min-width: 1024px) 33vw, 50vw" />
          </div>
          <div className="p-5">
            <h3 className="text-body-lg font-medium text-neutral-900">{item.title}</h3>
            <p className="mt-1.5 text-body text-neutral-600">{item.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
