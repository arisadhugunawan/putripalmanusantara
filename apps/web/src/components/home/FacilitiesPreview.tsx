import { Container, Section, buttonVariants } from "@ppn/ui-components";
import type { Facility } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { FacilityGrid } from "@/components/facilities/FacilityGrid";

/** FR-HOME-07 — facilities highlight grid with a link to the full page. */
export function FacilitiesPreview({ facilities }: { facilities: Facility[] }) {
  if (facilities.length === 0) return null;

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-h2 text-neutral-900">Our Facilities</h2>
          <Link href="/facilities" className={buttonVariants("ghost", "md")}>
            View All Facilities →
          </Link>
        </div>
        <div className="mt-10">
          <FacilityGrid facilities={facilities.slice(0, 3)} />
        </div>
      </Container>
    </Section>
  );
}
