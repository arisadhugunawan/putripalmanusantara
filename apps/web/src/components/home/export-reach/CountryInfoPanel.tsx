"use client";

import type { ExportDestination } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { getFlagEmoji } from "./flag-emoji";

/** Shown when a country is selected — only ever renders fields the admin actually filled
 * in (no invented export volume/frequency/port). */
export function CountryInfoPanel({
  destination,
  dictionary,
}: {
  destination: ExportDestination | null;
  dictionary: Dictionary;
}) {
  const statusLabels: Record<ExportDestination["export_status"], string> = {
    active_destination: dictionary.home.exportReach.statusActive,
    previous_destination: dictionary.home.exportReach.statusPrevious,
    potential_market: dictionary.home.exportReach.statusPotential,
    inactive: dictionary.home.exportReach.statusInactive,
  };

  if (!destination) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-card border border-dashed border-neutral-300 bg-white/60 p-8 text-center">
        <p className="text-body text-neutral-500">
          {dictionary.home.exportReach.selectCountryPrompt}
        </p>
      </div>
    );
  }

  return (
    <div
      key={destination.id}
      className="animate-fade-in-up flex h-full flex-col rounded-card border border-primary-100 bg-white p-6 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">
          {getFlagEmoji(destination.country_code)}
        </span>
        <div>
          <h3 className="text-h3 text-neutral-900">{destination.country_name}</h3>
          {destination.region && <p className="text-small text-neutral-500">{destination.region}</p>}
          <p
            className={cn(
              "text-small font-medium",
              destination.export_status === "active_destination" ? "text-primary-700" : "text-neutral-500",
            )}
          >
            {statusLabels[destination.export_status]}
          </p>
        </div>
      </div>

      {destination.products.length > 0 && (
        <div className="mt-4">
          <p className="text-small font-medium uppercase tracking-wide text-neutral-500">
            {dictionary.home.exportReach.productsLabel}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {destination.products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  className="rounded-field border border-neutral-200 bg-neutral-50 px-3 py-1 text-small text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {destination.description && (
        <p className="mt-4 text-body text-neutral-600">{destination.description}</p>
      )}

      {(destination.export_volume || destination.export_frequency || destination.destination_port) && (
        <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-3">
          {destination.export_volume && (
            <div>
              <dt className="text-small text-neutral-500">{dictionary.home.exportReach.exportVolumeLabel}</dt>
              <dd className="text-body font-medium text-neutral-900">{destination.export_volume}</dd>
            </div>
          )}
          {destination.export_frequency && (
            <div>
              <dt className="text-small text-neutral-500">{dictionary.home.exportReach.frequencyLabel}</dt>
              <dd className="text-body font-medium text-neutral-900">{destination.export_frequency}</dd>
            </div>
          )}
          {destination.destination_port && (
            <div>
              <dt className="text-small text-neutral-500">{dictionary.home.exportReach.destinationPortLabel}</dt>
              <dd className="text-body font-medium text-neutral-900">{destination.destination_port}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
