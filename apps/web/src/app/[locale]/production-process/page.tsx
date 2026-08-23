import { Container } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getPublishedHomepage } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { ProcessFlowchart } from "@/components/home/process/ProcessFlowchart";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/production-process">): Promise<Metadata> {
  const { locale } = await params;
  // Same `getPublishedHomepage` call the page body below already makes (line ~28) — Next.js
  // dedupes identical `fetch()` calls within one render pass, so this costs no second
  // round-trip. `process_section.heading`/`description` is the CMS's own translated heading
  // for this exact subject (Homepage renders the identical section under "Our Supply & Export
  // Process") and is already locale-resolved via `translate()`; the `||` fallback preserves
  // today's exact English copy for any locale without an admin-entered override.
  const homepage = await getPublishedHomepage(locale).catch(() => null);
  return buildPageMetadata({
    title: homepage?.process_section.heading || "Our Supply & Export Process",
    description:
      homepage?.process_section.description ||
      "From local sourcing to global delivery: the structured process behind every CV Putri Palma Nusantara shipment.",
    path: "/production-process",
    locale,
  });
}

// Same published-snapshot data source as the Homepage's "Our Supply & Export Process" section
// (single source of truth) — just rendered under this page's own PageHeader instead of the
// Homepage's eyebrow/heading block.
export default async function ProductionProcessPage({
  params,
}: PageProps<"/[locale]/production-process">) {
  const { locale } = await params;
  const homepage = await getPublishedHomepage(locale);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Our Supply & Export Process" }]}
        title="Our Supply & Export Process"
        description="A structured process designed to maintain quality, efficiency, and reliability from product sourcing to final shipment."
        locale={locale}
      />
      <section className="relative overflow-hidden bg-linear-to-b from-white via-primary-50/20 to-white py-(--spacing-section-y-comfortable)">
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
          className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl"
        />
        <Container className="relative">
          <ProcessFlowchart steps={homepage.production_steps} />
        </Container>
      </section>
    </main>
  );
}
