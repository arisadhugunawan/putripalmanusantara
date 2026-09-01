"use client";

import type {
  AboutCompanyFact,
  AboutCompanyFacilitiesFaqSection,
  AboutCompanyFacilitiesSection,
  AboutCompanyMoqPaymentSection,
  AboutCompanyProfile,
  AboutCompanyShipmentTermsSection,
  AboutCompanySectionConfig,
  AboutCompanyLegalSection,
  AboutCompanySocialLink,
  AboutCompanyTeamSection,
  AboutCompanyWhatWeDoSection,
  AboutCompanySectionKey,
  ExportDestination,
  Facility,
  FacilitiesFaqItem,
  FactoryProfile,
  LegalCertificateDocument,
  LegalDocumentCategory,
  MoqPaymentBusinessTerm,
  MoqPaymentQuickCard,
  ShipmentCommitmentItem,
  ShipmentContainerType,
  ShipmentDocument,
  ShipmentLoadingLocation,
  ShipmentScheduleStep,
  ShippingArrangementItem,
  TeamMember,
  WhatWeDoItem,
  WhoWeSupplyItem,
} from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
// Client component — can't call the server-only `getDictionary()` — and this preview always
// shows the default-locale (English) content anyway (no `?locale=` is ever sent to the public
// GET endpoints below), so importing the English dictionary module directly matches exactly
// what's already being previewed.
import enDictionary from "@/i18n/dictionaries/en";
import { CompanyProfileSection } from "@/components/about/CompanyProfileSection";
import { TeamSection } from "@/components/about/TeamSection";
import { WhatWeDoSection } from "@/components/about/WhatWeDoSection";
import { LegalCertificateSection } from "@/components/about/LegalCertificateSection";
import { FactorySection } from "@/components/about/FactorySection";
import { FacilitiesFaqSection } from "@/components/facilities/faq/FacilitiesFaqSection";
import { FacilityShowcase } from "@/components/facilities/FacilityShowcase";
import { MoqPaymentTermsSection } from "@/components/facilities/moq-payment/MoqPaymentTermsSection";
import { ShipmentTermsSection } from "@/components/facilities/shipment-terms/ShipmentTermsSection";

interface PreviewData {
  sectionConfig: AboutCompanySectionConfig[];
  profile: AboutCompanyProfile;
  facts: AboutCompanyFact[];
  exportDestinations: ExportDestination[];
  socialLinks: AboutCompanySocialLink[];
  companyProfileCountries: ExportDestination[];
  teamMembers: TeamMember[];
  teamSection: AboutCompanyTeamSection;
  whatWeDoSection: AboutCompanyWhatWeDoSection;
  whatWeDoItems: WhatWeDoItem[];
  whoWeSupplyItems: WhoWeSupplyItem[];
  legalDocuments: LegalCertificateDocument[];
  legalSection: AboutCompanyLegalSection;
  legalCategories: LegalDocumentCategory[];
  factory: FactoryProfile;
  facilities: Facility[];
  facilitiesSection: AboutCompanyFacilitiesSection;
  moqPaymentSection: AboutCompanyMoqPaymentSection;
  moqPaymentQuickCards: MoqPaymentQuickCard[];
  moqPaymentBusinessTerms: MoqPaymentBusinessTerm[];
  shipmentTermsSection: AboutCompanyShipmentTermsSection;
  shippingArrangementItems: ShippingArrangementItem[];
  shipmentLoadingLocations: ShipmentLoadingLocation[];
  shipmentContainerTypes: ShipmentContainerType[];
  shipmentScheduleSteps: ShipmentScheduleStep[];
  shipmentDocuments: ShipmentDocument[];
  shipmentCommitmentItems: ShipmentCommitmentItem[];
  facilitiesFaqSection: AboutCompanyFacilitiesFaqSection;
  facilitiesFaqItems: FacilitiesFaqItem[];
}

/**
 * Draft preview — always renders the *current unpublished* Admin state. Unlike Homepage's
 * preview (which can read already-`publicOnly`-filtered public GET endpoints), About Company
 * has no per-entity public list endpoints — only the aggregated published-snapshot one — so
 * this reads the admin (unfiltered) endpoints directly and re-applies the exact same
 * `active`-only + order filtering `about-company.service.ts`'s `buildSnapshotPayload()` uses,
 * so the preview matches what Publish would actually produce. Never affects the public site:
 * read-only, and reads live draft tables rather than the frozen `AboutCompanyPublishedSnapshot`.
 */
export default function AboutCompanyPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [
          sectionConfig,
          profile,
          facts,
          exportDestinations,
          socialLinks,
          companyProfileCountries,
          teamMembers,
          teamSection,
          whatWeDoSection,
          whatWeDoItems,
          whoWeSupplyItems,
          legalDocuments,
          legalSection,
          legalCategories,
          factory,
          facilities,
          facilitiesSection,
          moqPaymentSection,
          moqPaymentQuickCards,
          moqPaymentBusinessTerms,
          shipmentTermsSection,
          shippingArrangementItems,
          shipmentLoadingLocations,
          shipmentContainerTypes,
          shipmentScheduleSteps,
          shipmentDocuments,
          shipmentCommitmentItems,
          facilitiesFaqSection,
          facilitiesFaqItems,
        ] = await Promise.all([
          adminApi.get<AboutCompanySectionConfig[]>("/admin/about-company/sections"),
          adminApi.get<AboutCompanyProfile>("/admin/about-company/profile"),
          adminApi.get<AboutCompanyFact[]>("/admin/about-company/facts"),
          adminApi.get<ExportDestination[]>("/admin/homepage/export-destinations"),
          adminApi.get<AboutCompanySocialLink[]>("/admin/about-company/social-links"),
          adminApi.get<ExportDestination[]>("/admin/about-company/company-profile-countries"),
          adminApi.get<TeamMember[]>("/admin/about-company/team-members"),
          adminApi.get<AboutCompanyTeamSection>("/admin/about-company/team-section"),
          adminApi.get<AboutCompanyWhatWeDoSection>("/admin/about-company/what-we-do-section"),
          adminApi.get<WhatWeDoItem[]>("/admin/about-company/what-we-do-items"),
          adminApi.get<WhoWeSupplyItem[]>("/admin/about-company/who-we-supply-items"),
          adminApi.get<LegalCertificateDocument[]>("/admin/about-company/legal-documents"),
          adminApi.get<AboutCompanyLegalSection>("/admin/about-company/legal-section"),
          adminApi.get<LegalDocumentCategory[]>("/admin/about-company/legal-categories"),
          adminApi.get<FactoryProfile>("/admin/about-company/factory"),
          adminApi.get<Facility[]>("/admin/about-company/facilities"),
          adminApi.get<AboutCompanyFacilitiesSection>("/admin/about-company/facilities-section"),
          adminApi.get<AboutCompanyMoqPaymentSection>("/admin/about-company/moq-payment-section"),
          adminApi.get<MoqPaymentQuickCard[]>("/admin/about-company/moq-payment-quick-cards"),
          adminApi.get<MoqPaymentBusinessTerm[]>("/admin/about-company/moq-payment-business-terms"),
          adminApi.get<AboutCompanyShipmentTermsSection>("/admin/about-company/shipment-terms-section"),
          adminApi.get<ShippingArrangementItem[]>("/admin/about-company/shipping-arrangement-items"),
          adminApi.get<ShipmentLoadingLocation[]>("/admin/about-company/shipment-loading-locations"),
          adminApi.get<ShipmentContainerType[]>("/admin/about-company/shipment-container-types"),
          adminApi.get<ShipmentScheduleStep[]>("/admin/about-company/shipment-schedule-steps"),
          adminApi.get<ShipmentDocument[]>("/admin/about-company/shipment-documents"),
          adminApi.get<ShipmentCommitmentItem[]>("/admin/about-company/shipment-commitment-items"),
          adminApi.get<AboutCompanyFacilitiesFaqSection>("/admin/about-company/facilities-faq-section"),
          adminApi.get<FacilitiesFaqItem[]>("/admin/about-company/facilities-faq-items"),
        ]);
        setData({
          sectionConfig,
          profile,
          facts: facts.filter((f) => f.active).sort((a, b) => a.order - b.order),
          // Mirrors buildSnapshotPayload's dual gate so the preview matches what Publish produces.
          exportDestinations: exportDestinations
            .filter((d) => d.enabled && d.export_status === "active_destination")
            .sort((a, b) => a.order - b.order),
          socialLinks: socialLinks.filter((s) => s.active).sort((a, b) => a.order - b.order),
          companyProfileCountries: companyProfileCountries
            .filter((d) => d.enabled && d.show_in_company_profile)
            .sort((a, b) => a.order - b.order),
          teamMembers: teamMembers.filter((m) => m.active).sort((a, b) => a.order - b.order),
          teamSection,
          whatWeDoSection,
          whatWeDoItems: whatWeDoItems.filter((i) => i.active).sort((a, b) => a.order - b.order),
          whoWeSupplyItems: whoWeSupplyItems.filter((i) => i.active).sort((a, b) => a.order - b.order),
          legalDocuments: legalDocuments.filter((d) => d.active).sort((a, b) => a.order - b.order),
          legalSection,
          legalCategories,
          factory: {
            ...factory,
            gallery: factory.gallery.filter((g) => g.active),
            documents: factory.documents.filter((d) => d.active),
            videos: factory.videos.filter((v) => v.active),
          },
          facilities: facilities
            .filter((f) => f.active)
            .sort((a, b) => a.order - b.order)
            .map((f) => ({ ...f, gallery: f.gallery.filter((g) => g.active) })),
          facilitiesSection,
          moqPaymentSection,
          moqPaymentQuickCards: moqPaymentQuickCards.filter((c) => c.active).sort((a, b) => a.order - b.order),
          moqPaymentBusinessTerms: moqPaymentBusinessTerms
            .filter((t) => t.active)
            .sort((a, b) => a.order - b.order),
          shipmentTermsSection,
          shippingArrangementItems: shippingArrangementItems
            .filter((i) => i.active)
            .sort((a, b) => a.order - b.order),
          shipmentLoadingLocations: shipmentLoadingLocations
            .filter((l) => l.active)
            .sort((a, b) => a.order - b.order),
          shipmentContainerTypes: shipmentContainerTypes
            .filter((t) => t.active)
            .sort((a, b) => a.order - b.order),
          shipmentScheduleSteps: shipmentScheduleSteps
            .filter((s) => s.active)
            .sort((a, b) => a.order - b.order),
          shipmentDocuments: shipmentDocuments.filter((d) => d.active).sort((a, b) => a.order - b.order),
          shipmentCommitmentItems: shipmentCommitmentItems
            .filter((i) => i.active)
            .sort((a, b) => a.order - b.order),
          facilitiesFaqSection,
          facilitiesFaqItems: facilitiesFaqItems
            .filter((i) => i.active)
            .sort((a, b) => a.order - b.order)
            .map((i) => ({ ...i, tags: i.tags.filter((t) => t.active) })),
        });
      } catch {
        setError(true);
      }
    }
    void load();
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-100 px-4 py-2 text-small text-amber-900">
        <span>
          <strong>Draft Preview</strong> — menampilkan perubahan yang belum dipublikasikan. Pengunjung situs
          tidak melihat ini.
        </span>
        <Link href="/admin/about-company" className="font-medium underline">
          ← Kembali ke About Company Manager
        </Link>
      </div>

      {error && <p className="p-8 text-center text-body text-red-600">Gagal memuat preview. Silakan coba lagi.</p>}
      {!error && !data && <p className="p-8 text-center text-body text-neutral-500">Memuat preview...</p>}

      {data && (
        <main>
          <Container className="flex flex-col gap-20 py-12 lg:gap-28 lg:py-20">
            {[...data.sectionConfig]
              .filter((s) => s.visible)
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <div key={section.key}>{renderSection(section.key, data)}</div>
              ))}
          </Container>
        </main>
      )}
    </div>
  );
}

function renderSection(key: AboutCompanySectionKey, data: PreviewData) {
  switch (key) {
    case "company":
      return (
        <CompanyProfileSection
          profile={data.profile}
          facts={data.facts}
          socialLinks={data.socialLinks}
          companyProfileCountries={data.companyProfileCountries}
          dictionary={enDictionary}
        />
      );
    case "team":
      return <TeamSection members={data.teamMembers} section={data.teamSection} dictionary={enDictionary} />;
    case "what_we_do":
      return (
        <WhatWeDoSection
          section={data.whatWeDoSection}
          items={data.whatWeDoItems}
          whoWeSupplyItems={data.whoWeSupplyItems}
          dictionary={enDictionary}
        />
      );
    case "legal_certificate":
      return (
        <LegalCertificateSection
          documents={data.legalDocuments}
          section={data.legalSection}
          categories={data.legalCategories}
          dictionary={enDictionary}
        />
      );
    case "factory":
      return <FactorySection factory={data.factory} facilities={data.facilities} dictionary={enDictionary} />;
    case "facilities":
      return (
        <FacilityShowcase
          facilities={data.facilities}
          section={data.facilitiesSection}
          dictionary={enDictionary.facilities}
          carouselAriaLabel={enDictionary.nav.facilities}
          locationLabel={enDictionary.contact.locationLabel}
        />
      );
    case "moq_payment_terms":
      return (
        <MoqPaymentTermsSection
          section={data.moqPaymentSection}
          quickCards={data.moqPaymentQuickCards}
          businessTerms={data.moqPaymentBusinessTerms}
          dictionary={enDictionary.facilities}
        />
      );
    case "shipment_terms":
      return (
        <ShipmentTermsSection
          section={data.shipmentTermsSection}
          arrangementItems={data.shippingArrangementItems}
          loadingLocations={data.shipmentLoadingLocations}
          containerTypes={data.shipmentContainerTypes}
          scheduleSteps={data.shipmentScheduleSteps}
          documents={data.shipmentDocuments}
          commitmentItems={data.shipmentCommitmentItems}
          dictionary={enDictionary.facilities}
        />
      );
    case "facilities_faq":
      return <FacilitiesFaqSection section={data.facilitiesFaqSection} items={data.facilitiesFaqItems} />;
    default:
      return null;
  }
}
