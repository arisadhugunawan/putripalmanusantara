import { Card } from "@ppn/ui-components";
import type { Facility } from "@ppn/shared-types";
import { SafeImage } from "@/components/SafeImage";
import { FacilityIcon } from "./FacilityIcons";

/** One facility card for the Homepage carousel (`FacilitiesPreview`). Not a link — facilities
 * have no detail route of their own (they're switched via in-page tabs on `/facilities`,
 * `FacilityShowcase.tsx`), so this stays a plain, non-interactive `Card` with a hover-only
 * polish (lift + subtle image zoom) rather than pretending to navigate anywhere. */
export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Card hoverable className="group h-full overflow-hidden p-0">
      <div className="relative aspect-4/3 overflow-hidden">
        <SafeImage
          media={facility.cover_image}
          sizes="(min-width: 1024px) 32vw, (min-width: 640px) 55vw, 85vw"
          className="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-start gap-3 p-6">
        <FacilityIcon slug={facility.slug} className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" />
        <div>
          <h3 className="text-h3 text-neutral-900">{facility.name}</h3>
          <p className="mt-2 text-body text-neutral-600">{facility.description}</p>
        </div>
      </div>
    </Card>
  );
}
