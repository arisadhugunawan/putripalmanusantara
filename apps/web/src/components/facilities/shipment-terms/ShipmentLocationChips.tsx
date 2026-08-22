import type { ShipmentLoadingLocation } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { SHIPMENT_ICONS } from "./ShipmentIcons";

/** Loading-location chips — a real link when `maps_url` is set, plain (non-interactive) text
 * otherwise. Never a fake link. */
export function ShipmentLocationChips({ locations }: { locations: ShipmentLoadingLocation[] }) {
  const MapPinIcon = SHIPMENT_ICONS.map_pin;
  if (locations.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {locations.map((location) => {
        const label = [location.name, location.region].filter(Boolean).join(" — ");
        const chipClass = cn(
          "inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2 text-small font-medium text-neutral-900",
          location.maps_url && "transition-colors hover:border-primary-400 hover:bg-primary-50",
        );
        return location.maps_url ? (
          <Link key={location.id} href={location.maps_url} target="_blank" rel="noopener noreferrer" className={chipClass}>
            <MapPinIcon className="h-4 w-4 text-primary-600" />
            {label}
          </Link>
        ) : (
          <span key={location.id} className={chipClass}>
            <MapPinIcon className="h-4 w-4 text-primary-600" />
            {label}
          </span>
        );
      })}
    </div>
  );
}
