import type {
  DecorativeGraphic,
  HomepageSupplyNetworkSection,
  SupplyNetworkConnection,
  SupplyNetworkCountry,
  SupplyNetworkItem,
} from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SupplyNetworkVisual } from "./SupplyNetworkVisual";

/** Homepage wrapper for "Our Supply Network" (replaces "Why Choose Us?") — header copy + the
 * 3D ecosystem diagram. No closing CTA card (removed per request — the diagram itself is the
 * whole section now). Same dot-grid + gradient-orb background treatment as `ProcessSection.tsx`
 * so the two adjacent sections read as one visual family. Renders nothing when there are no
 * active items, same "nothing to show" convention as every other section here. */
export function SupplyNetworkSection({
  section,
  items,
  connections,
  countries,
  decorativeGraphics,
}: {
  section: HomepageSupplyNetworkSection;
  items: SupplyNetworkItem[];
  connections: SupplyNetworkConnection[];
  countries: SupplyNetworkCountry[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (items.length === 0) return null;

  return (
    <section
      id="our-supply-network"
      className="relative scroll-mt-24 overflow-hidden bg-linear-to-b from-white via-primary-50/20 to-white py-(--spacing-section-y-comfortable)"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(74,101,30,0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl"
      />

      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <FadeUpSection className="flex flex-col items-center text-center">
          <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
            {section.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
          </p>
          <h2 className="mt-4 max-w-2xl text-h2 text-neutral-900">{section.heading}</h2>
          {section.description && (
            <p className="mt-3 max-w-xl text-body-lg text-neutral-600">{section.description}</p>
          )}
        </FadeUpSection>

        <div className="mt-12 md:mt-16">
          <SupplyNetworkVisual section={section} items={items} connections={connections} countries={countries} />
        </div>
      </Container>
    </section>
  );
}
