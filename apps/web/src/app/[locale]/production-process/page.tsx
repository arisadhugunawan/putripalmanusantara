import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getProductionSteps } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { ProductionTimeline } from "@/components/production/ProductionTimeline";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/production-process">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Production Process",
    description:
      "From farmer to export: the 8-stage production process behind every CV Putri Palma Nusantara shipment.",
    path: "/production-process",
    locale,
  });
}

// FR-PROC-01/02/03 — full 8-stage timeline.
export default async function ProductionProcessPage({
  params,
}: PageProps<"/[locale]/production-process">) {
  const { locale } = await params;
  const steps = await getProductionSteps(locale);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Production Process" }]}
        title="Our Production Process"
        description="Every shipment follows the same 8-stage process, from sourcing to export, to ensure consistent quality."
        locale={locale}
      />
      <Section>
        <Container>
          <ProductionTimeline steps={steps} />
        </Container>
      </Section>
    </main>
  );
}
