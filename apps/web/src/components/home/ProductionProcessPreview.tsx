import { Container, Section, buttonVariants } from "@ppn/ui-components";
import type { ProductionStep } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { ProductionTimeline } from "@/components/production/ProductionTimeline";

/** FR-HOME-06 — condensed production process timeline with a link to the full page. */
export function ProductionProcessPreview({ steps }: { steps: ProductionStep[] }) {
  if (steps.length === 0) return null;

  return (
    <Section tone="soft">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-h2 text-neutral-900">Our Production Process</h2>
          <Link href="/production-process" className={buttonVariants("ghost", "md")}>
            See Full Process →
          </Link>
        </div>
        <div className="mt-10">
          <ProductionTimeline steps={steps} compact />
        </div>
      </Container>
    </Section>
  );
}
