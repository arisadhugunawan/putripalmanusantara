import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getProductionSteps } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { ProductionTimeline } from "@/components/production/ProductionTimeline";

export const metadata: Metadata = {
  title: "Production Process | CV Putri Palma Nusantara",
  description:
    "From farmer to export: the 8-stage production process behind every CV Putri Palma Nusantara shipment.",
};

// FR-PROC-01/02/03 — full 8-stage timeline.
export default async function ProductionProcessPage() {
  const steps = await getProductionSteps();

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Production Process" }]}
        title="Our Production Process"
        description="Every shipment follows the same 8-stage process, from sourcing to export, to ensure consistent quality."
      />
      <Section>
        <Container>
          <ProductionTimeline steps={steps} />
        </Container>
      </Section>
    </main>
  );
}
