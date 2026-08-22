import { Card } from "@ppn/ui-components";
import type { Facility } from "@ppn/shared-types";
import { SafeImage } from "@/components/SafeImage";

/** Compact cover-image-only grid — used for the Homepage teaser only. The full `/facilities`
 * page uses the richer `FacilityShowcase` (multi-photo gallery + lightbox) instead. */
export function FacilityPreviewGrid({ facilities }: { facilities: Facility[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {facilities.map((facility) => (
        <Card key={facility.id} className="overflow-hidden p-0">
          <div className="relative aspect-4/3">
            <SafeImage media={facility.cover_image} sizes="(min-width: 1024px) 33vw, 50vw" />
          </div>
          <div className="p-6">
            <h3 className="text-h3 text-neutral-900">{facility.name}</h3>
            <p className="mt-2 text-body text-neutral-600">{facility.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
