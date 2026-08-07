import { Card } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import { SafeImage } from "@/components/SafeImage";

export interface PackagingOption {
  id: string;
  title: string;
  description: string;
  media: Media | null;
  productName: string;
}

/**
 * "Packaging Options" section — built from each product's real, CMS-authored packaging
 * entry (Admin > Products > Packaging) rather than a fabricated generic list of bag/loading
 * types, since PPN hasn't confirmed specific packaging materials for this page. Each card
 * keeps the source product name so buyers can see what it applies to.
 */
export function PackagingOptionCards({ items }: { items: PackagingOption[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} hoverable className="overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1">
          <div className="relative aspect-4/3 overflow-hidden">
            <SafeImage media={item.media} sizes="(min-width: 1024px) 33vw, 50vw" />
          </div>
          <div className="p-5">
            <p className="text-small font-medium uppercase tracking-wide text-primary-700">
              Suitable for {item.productName}
            </p>
            <h3 className="mt-1 text-body-lg font-medium text-neutral-900">{item.title}</h3>
            <p className="mt-1.5 text-body text-neutral-600">{item.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
