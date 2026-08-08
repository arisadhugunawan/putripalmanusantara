import worldMap from "@/data/world-map.json";

/**
 * Pure server-rendered SVG markup — every country path (~173, Natural Earth 110m
 * resolution, precomputed once at data-generation time, see `apps/web/src/data/world-map.json`)
 * ships as static HTML, not JS. `WorldMapInteractive.tsx` (a client component) wraps this as
 * `children` and attaches event-delegated hover/click/keyboard handling on top — the ~170KB
 * of path data never enters the client JS bundle at all.
 */
export function WorldMapSvg({ destinationCodes }: { destinationCodes: ReadonlySet<string> }) {
  return (
    <svg
      viewBox={`0 0 ${worldMap.width} ${worldMap.height}`}
      className="h-auto w-full"
      role="img"
      aria-label="World map highlighting CV Putri Palma Nusantara's export destinations"
    >
      {worldMap.countries.map((country) => {
        const isDestination = destinationCodes.has(country.alpha2);
        return (
          <path
            key={country.alpha2}
            d={country.d}
            data-alpha2={country.alpha2}
            data-name={country.name}
            data-destination={isDestination ? "true" : undefined}
            tabIndex={isDestination ? 0 : -1}
            role={isDestination ? "button" : undefined}
            aria-label={isDestination ? `${country.name} — Export Destination` : undefined}
            className={isDestination ? "export-map-country export-map-country--active" : "export-map-country"}
          />
        );
      })}
    </svg>
  );
}
