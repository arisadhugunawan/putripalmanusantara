import { Accordion, Container, Section, buttonVariants } from "@ppn/ui-components";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";
import {
  getFacilities,
  getFaqs,
  getHomepageStatistics,
  getProductBySlug,
  getProductionSteps,
  getProducts,
} from "@/lib/api";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { FacilitiesNav, type FacilitiesSection } from "@/components/facilities/FacilitiesNav";
import { FacilityGrid } from "@/components/facilities/FacilityGrid";
import { PackagingOptionCards, type PackagingOption } from "@/components/facilities/PackagingOptionCards";
import { InfoCardGrid, type InfoCardItem } from "@/components/products/catalogue/InfoCardGrid";
import { PageHeader } from "@/components/page/PageHeader";
import { ProductionTimeline } from "@/components/production/ProductionTimeline";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/facilities">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Facilities",
    description:
      "Explore CV Putri Palma Nusantara's production facilities, process, trade terms, shipment logistics, and packaging options for coconut product exports.",
    path: "/facilities",
    locale,
  });
}

const SECTIONS: FacilitiesSection[] = [
  { id: "facilities", label: "Facilities" },
  { id: "production-process", label: "Production Process" },
  { id: "moq-payment", label: "MOQ & Payment Terms" },
  { id: "shipment-terms", label: "Shipment Terms" },
  { id: "packaging-options", label: "Packaging Options" },
  { id: "faq", label: "FAQ" },
];

export default async function FacilitiesPage({ params }: PageProps<"/[locale]/facilities">) {
  const { locale } = await params;
  const [facilities, productionSteps, statistics, faqs, products] = await Promise.all([
    getFacilities(locale),
    getProductionSteps(locale),
    getHomepageStatistics(locale),
    getFaqs(locale),
    getProducts(locale),
  ]);

  const productDetails = await Promise.all(
    products.map((product) => getProductBySlug(product.slug, locale)),
  );
  // Packaging Options uses each product's real, CMS-authored packaging entry (Admin >
  // Products > Packaging) rather than a fabricated generic bag/loading-type list — see
  // PackagingOptionCards.tsx.
  const packagingOptions: PackagingOption[] = productDetails.flatMap((product) =>
    product
      ? product.packaging.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          media: item.media,
          productName: product.name,
        }))
      : [],
  );

  const productionCapacity = statistics.find((stat) =>
    stat.label.toLowerCase().includes("production capacity"),
  )?.value;

  // MOQ, lead time, and payment specifics are deliberately framed as "varies — confirm via
  // quotation" rather than fixed numbers, matching the site's own existing FAQ answers (see
  // getFaqs seed data) instead of inventing figures PPN hasn't confirmed.
  const moqPaymentCards: InfoCardItem[] = [
    { id: "moq", label: "Minimum Order Quantity", value: "Varies by product and packaging — confirmed with each Request Quotation." },
    { id: "capacity", label: "Production Capacity", value: productionCapacity ?? "Available on request via our team." },
    { id: "lead-time", label: "Lead Time", value: "Depends on product and order volume — an estimated schedule is provided after reviewing your request." },
    { id: "payment", label: "Payment Terms", value: "Letter of Credit (L/C), Telegraphic Transfer (T/T), or terms negotiated directly for repeat buyers." },
    { id: "currency", label: "Supported Currencies", value: "USD as primary currency; other currencies negotiable on request." },
    { id: "export-policy", label: "Export Policy", value: "Standard export terms are agreed per order — see Shipment Terms below for Incoterms and logistics." },
  ];

  const shipmentCards: InfoCardItem[] = [
    { id: "incoterms", label: "Incoterms Available", value: "FOB, CIF, or EXW — agreed per shipment based on buyer preference." },
    { id: "port", label: "Port of Loading", value: "Nearest seaport to our facility in Cilacap, Central Java, Indonesia." },
    { id: "transit", label: "Estimated Transit Time", value: "Varies by destination port — confirmed at booking." },
    { id: "documents", label: "Required Documents", value: "Commercial Invoice, Packing List, Certificate of Origin, and Phytosanitary Certificate provided with every shipment." },
    { id: "container", label: "Container Capacity", value: "Approx. 18–20 tons per 20ft container, 24–26 tons per 40ft container (product-dependent)." },
  ];

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Facilities" }]}
        title="Facilities"
        description="Purpose-built infrastructure, production process, and trade terms behind every CV Putri Palma Nusantara shipment."
        locale={locale}
      />

      <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-16 lg:py-20">
        <FacilitiesNav sections={SECTIONS} />

        <div className="flex flex-col gap-20 lg:gap-28">
          {/* Facilities */}
          <section id="facilities" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">Facilities</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Purpose-built infrastructure supporting consistent, export-ready production at
                every stage — from raw material intake through container loading.
              </p>
              <div className="mt-8">
                {facilities.length === 0 ? (
                  <p className="text-body text-neutral-600">No facility information available yet.</p>
                ) : (
                  <FacilityGrid facilities={facilities} />
                )}
              </div>
            </FadeUpSection>
          </section>

          {/* Production Process */}
          <section id="production-process" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">Production Process</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Every shipment follows the same process, from sourcing to export, to ensure
                consistent quality.
              </p>
              <div className="mt-10">
                {productionSteps.length === 0 ? (
                  <p className="text-body text-neutral-600">Production process details will be added soon.</p>
                ) : (
                  <ProductionTimeline steps={productionSteps} />
                )}
              </div>
            </FadeUpSection>
          </section>

          {/* MOQ & Payment Terms */}
          <section id="moq-payment" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">MOQ & Payment Terms</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Exact figures depend on product and order volume — request a quotation for
                terms tailored to your order.
              </p>
              <div className="mt-8">
                <InfoCardGrid items={moqPaymentCards} />
              </div>
              <Link href="/#request-quotation" className={`mt-6 inline-flex ${buttonVariants("primary", "md")}`}>
                Request Quotation
              </Link>
            </FadeUpSection>
          </section>

          {/* Shipment Terms */}
          <section id="shipment-terms" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">Shipment Terms</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Export logistics and documentation supporting a smooth handover to your
                freight forwarder.
              </p>
              <div className="mt-8">
                <InfoCardGrid items={shipmentCards} />
              </div>
            </FadeUpSection>
          </section>

          {/* Packaging Options */}
          <section id="packaging-options" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">Packaging Options</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Packaging is arranged per product and buyer specification.
              </p>
              <div className="mt-8">
                {packagingOptions.length === 0 ? (
                  <p className="text-body text-neutral-600">Packaging option details will be added soon.</p>
                ) : (
                  <PackagingOptionCards items={packagingOptions} />
                )}
              </div>
            </FadeUpSection>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">FAQ</h2>
              <div className="mt-8">
                {faqs.length === 0 ? (
                  <p className="text-body text-neutral-600">No FAQs published yet.</p>
                ) : (
                  <Accordion items={faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer }))} />
                )}
              </div>
            </FadeUpSection>
          </section>
        </div>
      </Container>

      <Section tone="soft">
        <Container className="text-center">
          <h2 className="text-h2 text-neutral-900">Ready to work with us?</h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-neutral-600">
            Tell us what you need and our team will respond with pricing and availability.
          </p>
          <Link href="/#request-quotation" className={`mt-6 inline-flex ${buttonVariants("primary", "lg")}`}>
            Request Quotation
          </Link>
        </Container>
      </Section>
    </main>
  );
}
