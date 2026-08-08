import type { DecorativeGraphic, HomepageWhyChooseUs } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { WhyChooseUsGrid } from "./WhyChooseUsGrid";

/**
 * "Why Choose Us?" — icon + short title only, by design. This section must never grow a
 * description/paragraph per card, an accordion, a modal, or a popup; if a future brief asks
 * for more detail per item, that belongs in a different section (e.g. the About page), not
 * here. Cards are fetched from the CMS (`HomepageWhyChooseUs`), not hardcoded, so new items
 * can be added from the admin without a code change. Renders nothing when the CMS has no
 * enabled+featured items.
 */
export function WhyChooseUsSection({
  items,
  decorativeGraphics,
}: {
  items: HomepageWhyChooseUs[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-primary-50/30 to-white py-16 md:py-28">
      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <FadeUpSection className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary-400 sm:w-14" />
            <h2 className="text-h2 text-neutral-900">
              Why <span className="text-primary-700">Choose</span> Us?
            </h2>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary-400 sm:w-14" />
          </div>
        </FadeUpSection>

        <div className="mt-10 md:mt-14">
          <WhyChooseUsGrid items={items} />
        </div>
      </Container>
    </section>
  );
}
