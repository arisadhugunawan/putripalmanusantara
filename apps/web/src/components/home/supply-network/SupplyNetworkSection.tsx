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
import { CoconutMark } from "@/components/SafeImage";
import { SupplyNetworkVisual } from "./SupplyNetworkVisual";

/** Homepage wrapper for "Our Supply Network" (replaces "Why Choose Us?") — header copy + the
 * coconut supply journey. Redesigned (2026-08) from a busy dot-grid/gradient-orb/3D-diagram
 * treatment into a calm, mostly-white section — the CMS section header fields (eyebrow/
 * heading/description), the `SupplyNetworkVisual` journey below it, and the
 * `connections`/`countries` props this component still receives from the page are all
 * unchanged; only how "busy" the section looks changed. `connections`/`countries` are no
 * longer forwarded into `SupplyNetworkVisual` — the new linear journey communicates sequence
 * on its own — but stay accepted here so the parent page's data-fetching/prop-passing didn't
 * need to change at all. Renders nothing when there are no active items, same "nothing to
 * show" convention as every other section here. */
export function SupplyNetworkSection({
  section,
  items,
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
      className="relative scroll-mt-24 overflow-hidden bg-white py-(--spacing-section-y-comfortable)"
    >
      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <FadeUpSection className="flex flex-col items-center text-center">
          <CoconutMark className="h-7 w-7 text-primary-500" />
          <p className="mt-3 flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span aria-hidden="true" className="h-px w-8 bg-primary-500" />
            {section.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-primary-500" />
          </p>
          <h2 className="mt-4 max-w-2xl text-h2 text-neutral-900">{section.heading}</h2>
          {section.description && (
            <p className="mt-3 max-w-xl text-body-lg text-neutral-600">{section.description}</p>
          )}
        </FadeUpSection>

        <div className="mt-14 md:mt-16">
          <SupplyNetworkVisual section={section} items={items} />
        </div>
      </Container>
    </section>
  );
}
