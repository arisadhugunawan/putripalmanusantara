import type { DecorativeGraphic, Facility } from "@ppn/shared-types";
import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { FacilityPreviewGrid } from "@/components/facilities/FacilityPreviewGrid";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SectionBackdrop } from "./SectionBackdrop";

/** FR-HOME-07 — facilities highlight grid with a link to the full page. */
export function FacilitiesPreview({
  facilities,
  decorativeGraphics = [],
}: {
  facilities: Facility[];
  decorativeGraphics?: DecorativeGraphic[];
}) {
  if (facilities.length === 0) return null;

  return (
    <Section tone="soft" className="relative overflow-hidden">
      <SectionBackdrop orbSide="left" />
      <DecorativeGraphics graphics={decorativeGraphics} />
      <Container className="relative">
        <FadeUpSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
              Built for Scale
            </p>
            <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">Our Facilities</h2>
          </div>
          <Link href="/facilities" className={buttonVariants("ghost", "md")}>
            View All Facilities →
          </Link>
        </FadeUpSection>
        <FadeUpSection className="mt-10" style={{ transitionDelay: "100ms" }}>
          <FacilityPreviewGrid facilities={facilities.slice(0, 3)} />
        </FadeUpSection>
      </Container>
    </Section>
  );
}
