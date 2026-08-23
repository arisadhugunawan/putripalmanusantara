import { Container } from "@ppn/ui-components";
import type { Locale } from "@ppn/shared-types";
import type { Metadata } from "next";
import { getPageHeader, getPublishedAboutCompany } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { FacilitiesFaqSection } from "@/components/facilities/faq/FacilitiesFaqSection";
import { FacilitiesNav, type FacilitiesSection } from "@/components/facilities/FacilitiesNav";
import { FacilityShowcase } from "@/components/facilities/FacilityShowcase";
import { MoqPaymentTermsSection } from "@/components/facilities/moq-payment/MoqPaymentTermsSection";
import { ShipmentTermsSection } from "@/components/facilities/shipment-terms/ShipmentTermsSection";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/facilities">): Promise<Metadata> {
  const { locale } = await params;
  // Same `getPublishedAboutCompany` call the page body below already makes (line ~36) — Next.js
  // dedupes identical `fetch()` calls within one render pass, so this costs no second
  // round-trip. `facilities_section.heading`/`description` is the CMS's own translated heading
  // for this page's eponymous first section and is already locale-resolved via `translate()`;
  // it does not summarize the MOQ/Shipment/FAQ sections further down the page, but it is real,
  // existing, translated content rather than an invented string. The `||` fallback preserves
  // today's exact English copy for any locale without an admin-entered override.
  const aboutCompany = await getPublishedAboutCompany(locale).catch(() => null);
  return buildPageMetadata({
    title: aboutCompany?.facilities_section.heading || "Facilities",
    description:
      aboutCompany?.facilities_section.description ||
      "Explore CV Putri Palma Nusantara's production facilities, MOQ and payment terms, and shipment logistics for coconut product exports.",
    path: "/facilities",
    locale,
  });
}

const SECTIONS: FacilitiesSection[] = [
  { id: "facilities", label: "Facilities" },
  { id: "moq-payment", label: "MOQ & Payment Terms" },
  { id: "shipment-terms", label: "Shipment Terms" },
  { id: "faq", label: "FAQ" },
];

export default async function FacilitiesPage({ params }: PageProps<"/[locale]/facilities">) {
  const { locale } = await params;
  const [aboutCompany, dictionary, headerConfig] = await Promise.all([
    getPublishedAboutCompany(locale),
    getDictionary(locale as Locale),
    getPageHeader("facilities", locale),
  ]);
  const facilities = aboutCompany.facilities;
  const facilitiesSection = aboutCompany.facilities_section;
  const moqPaymentSection = aboutCompany.moq_payment_section;
  const moqPaymentQuickCards = aboutCompany.moq_payment_quick_cards;
  const moqPaymentBusinessTerms = aboutCompany.moq_payment_business_terms;
  const shipmentTermsSection = aboutCompany.shipment_terms_section;
  const shippingArrangementItems = aboutCompany.shipping_arrangement_items;
  const shipmentLoadingLocations = aboutCompany.shipment_loading_locations;
  const shipmentContainerTypes = aboutCompany.shipment_container_types;
  const shipmentScheduleSteps = aboutCompany.shipment_schedule_steps;
  const shipmentDocuments = aboutCompany.shipment_documents;
  const shipmentCommitmentItems = aboutCompany.shipment_commitment_items;
  const facilitiesFaqSection = aboutCompany.facilities_faq_section;
  const facilitiesFaqItems = aboutCompany.facilities_faq_items;

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Facilities" }]}
        title="Facilities"
        description="Purpose-built infrastructure and trade terms behind every CV Putri Palma Nusantara shipment."
        locale={locale}
        headerConfig={headerConfig}
      />

      {/*
        `minmax(0, 1fr)` on the content column (not a bare `1fr`) is load-bearing: a CSS Grid
        item's automatic minimum width defaults to its content's min-content size, so without
        the explicit `0` floor, a wide non-wrapping descendant (the facility carousel track)
        forces this column — and the whole page — wider than the viewport instead of being
        clipped by its own `overflow-x-auto`. The sidebar column narrows from `lg` to `xl` so it
        doesn't eat into content width on smaller laptop screens.
      */}
      <Container className="grid w-full max-w-full grid-cols-1 gap-10 py-12 lg:grid-cols-[minmax(180px,220px)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:py-20 xl:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] xl:gap-16">
        <FacilitiesNav sections={SECTIONS} />

        <div className="flex min-w-0 flex-col gap-20 lg:gap-28">
          {/* Facilities */}
          <section id="facilities" className="scroll-mt-24">
            {facilities.length === 0 ? (
              <FadeUpSection>
                <h2 className="text-h2 text-neutral-900">Facilities</h2>
                <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                  No facility information available yet.
                </p>
              </FadeUpSection>
            ) : (
              <FacilityShowcase facilities={facilities} section={facilitiesSection} />
            )}
          </section>

          {/* MOQ & Payment Terms */}
          <section id="moq-payment" className="scroll-mt-24">
            <MoqPaymentTermsSection
              section={moqPaymentSection}
              quickCards={moqPaymentQuickCards}
              businessTerms={moqPaymentBusinessTerms}
            />
          </section>

          {/* Shipment Terms */}
          <section id="shipment-terms" className="scroll-mt-24">
            <ShipmentTermsSection
              section={shipmentTermsSection}
              arrangementItems={shippingArrangementItems}
              loadingLocations={shipmentLoadingLocations}
              containerTypes={shipmentContainerTypes}
              scheduleSteps={shipmentScheduleSteps}
              documents={shipmentDocuments}
              commitmentItems={shipmentCommitmentItems}
              routeLabels={dictionary.shipmentRoute}
            />
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24">
            <FacilitiesFaqSection section={facilitiesFaqSection} items={facilitiesFaqItems} />
          </section>
        </div>
      </Container>
    </main>
  );
}
