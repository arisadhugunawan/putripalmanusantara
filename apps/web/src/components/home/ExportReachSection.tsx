import type { DecorativeGraphic, ExportDestination, HomepageExportReach } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { WorldMapInteractive } from "./export-reach/WorldMapInteractive";
import { WorldMapSvg } from "./export-reach/WorldMapSvg";

/**
 * "Global Export Reach" — interactive world map of PPN's real export destinations
 * (Post-Launch). Fully CMS-driven: zero enabled+active_destination rows means the section
 * doesn't render at all, same convention as every other Homepage section in this project —
 * no placeholder countries are ever implied.
 */
export function ExportReachSection({
  section,
  destinations,
  decorativeGraphics,
}: {
  section: HomepageExportReach;
  destinations: ExportDestination[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (!section.enabled || destinations.length === 0) return null;

  const destinationCodes = new Set(destinations.map((d) => d.country_code));

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-primary-50/30 to-white py-(--spacing-section-y-comfortable)">
      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <FadeUpSection className="flex flex-col items-center text-center">
          <h2 className="text-h2 text-neutral-900">
            {section.heading.split(/(export)/i).map((part, i) =>
              /^export$/i.test(part) ? (
                <span key={i} className="text-primary-700">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-neutral-600">{section.subtitle}</p>
          <p className="mt-2 text-small font-medium uppercase tracking-wide text-primary-600">
            Serving {destinations.length} Export Destination{destinations.length !== 1 ? "s" : ""}
          </p>
        </FadeUpSection>

        <div className="mt-10 md:mt-14">
          <WorldMapInteractive destinations={destinations}>
            <WorldMapSvg destinationCodes={destinationCodes} />
          </WorldMapInteractive>
        </div>
      </Container>
    </section>
  );
}
