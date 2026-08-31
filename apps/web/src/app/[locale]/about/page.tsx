import type { AboutCompanySectionKey, Locale } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFacilities, getPageHeader, getPublishedAboutCompany } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionary.d";
import { AboutNav, type AboutSection } from "@/components/about/AboutNav";
import { CompanyProfileSection } from "@/components/about/CompanyProfileSection";
import { TeamSection } from "@/components/about/TeamSection";
import { WhatWeDoSection } from "@/components/about/WhatWeDoSection";
import { LegalCertificateSection } from "@/components/about/LegalCertificateSection";
import { FactorySection } from "@/components/about/FactorySection";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

// `AboutCompanySettings` (page_title/subtitle/seo_title/seo_description) has no `translations`
// column at all (confirmed against schema.prisma) — those fields are genuinely not locale-aware
// server-side yet, so they render identically in every locale except for the English fallback
// strings below, which ARE now locale-aware via the dictionary. See the About Company
// Multilingual final report for why this wasn't changed (a schema migration, out of scope here).
export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const [data, dictionary] = await Promise.all([
    getPublishedAboutCompany(locale),
    getDictionary(locale as Locale),
  ]);
  return buildPageMetadata({
    title: data.settings.seo_title || dictionary.aboutCompany.seoTitleFallback,
    description: data.settings.seo_description || dictionary.aboutCompany.seoDescriptionFallback,
    path: "/about",
    locale,
    imageUrl: data.settings.og_image?.file_url,
  });
}

/** In-page DOM anchor id per section key — kept as the pre-existing hyphenated ids since
 * `nav-config.ts` and `Footer.tsx` hardcode `/about#what-we-do` and `/about#legal` links. */
const SECTION_DOM_ID: Record<AboutCompanySectionKey, string> = {
  company: "company",
  team: "team",
  what_we_do: "what-we-do",
  legal_certificate: "legal",
  factory: "factory",
  // Facilities, MOQ & Payment Terms, Shipment Terms, and FAQ have no in-page block here — all
  // four are dedicated-page sections (`/facilities`), reachable via "View All Facilities →"
  // from the Factory section. Kept only for Record completeness/the Admin's own section-manager
  // bookkeeping; none appears in `orderedSections` below.
  facilities: "facilities",
  moq_payment_terms: "moq-payment-terms",
  shipment_terms: "shipment-terms",
  facilities_faq: "faq",
};

// These labels already exist, translated, as the Header/Footer nav's own dictionary keys
// (`dict.nav.aboutCompanyProfile` etc. — see `nav-config.ts`) — reused here instead of a second,
// English-only copy so the in-page nav can never drift from what the Header dropdown already says.
function buildSectionLabels(dict: Dictionary): Record<AboutCompanySectionKey, string> {
  return {
    company: dict.nav.aboutCompanyProfile,
    team: dict.nav.aboutTeam,
    what_we_do: dict.nav.aboutWhatWeDo,
    legal_certificate: dict.nav.aboutLegalCertificate,
    factory: dict.nav.aboutFactory,
    facilities: dict.nav.facilities,
    moq_payment_terms: dict.nav.facilitiesMoqPayment,
    shipment_terms: dict.nav.facilitiesShipmentTerms,
    facilities_faq: dict.nav.facilitiesFaq,
  };
}

// FR-ABOUT-01/02/03/04 — fully CMS-driven via the About Company Manager (Draft/Publish, see
// README "About Company Manager"). Section order/visibility comes from `section_config`.
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const [data, facilities, headerConfig, dictionary] = await Promise.all([
    getPublishedAboutCompany(locale),
    getFacilities(locale),
    getPageHeader("about-company", locale),
    getDictionary(locale as Locale),
  ]);

  if (!data.settings.visible) {
    notFound();
  }

  const orderedSections = [...data.section_config]
    // Facilities, MOQ & Payment Terms, Shipment Terms, and FAQ are excluded here — all four
    // render on their own dedicated page, not as an in-page block on /about (see
    // `SECTION_DOM_ID` comment above).
    .filter(
      (s) =>
        s.visible &&
        s.key !== "facilities" &&
        s.key !== "moq_payment_terms" &&
        s.key !== "shipment_terms" &&
        s.key !== "facilities_faq",
    )
    .sort((a, b) => a.order - b.order);

  const sectionLabels = buildSectionLabels(dictionary);
  const navSections: AboutSection[] = orderedSections.map((s) => ({
    id: SECTION_DOM_ID[s.key],
    label: sectionLabels[s.key],
  }));

  function renderSection(key: AboutCompanySectionKey) {
    switch (key) {
      case "company":
        return (
          <CompanyProfileSection
            profile={data.profile}
            facts={data.facts}
            socialLinks={data.social_links}
            companyProfileCountries={data.company_profile_countries}
            dictionary={dictionary}
          />
        );
      case "team":
        return <TeamSection members={data.team_members} section={data.team_section} dictionary={dictionary} />;
      case "what_we_do":
        return (
          <WhatWeDoSection
            section={data.what_we_do_section}
            items={data.what_we_do_items}
            whoWeSupplyItems={data.who_we_supply_items}
            dictionary={dictionary}
          />
        );
      case "legal_certificate":
        return (
          <LegalCertificateSection
            documents={data.legal_documents}
            section={data.legal_section}
            categories={data.legal_categories}
            dictionary={dictionary}
          />
        );
      case "factory":
        return <FactorySection factory={data.factory} facilities={facilities} dictionary={dictionary} />;
    }
  }

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: dictionary.nav.home, href: "/" }, { label: dictionary.aboutCompany.breadcrumbLabel }]}
        title={data.settings.page_title || dictionary.aboutCompany.pageTitleFallback}
        description={data.settings.page_subtitle || undefined}
        locale={locale}
        headerConfig={headerConfig}
      />

      <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-16 lg:py-20">
        <AboutNav sections={navSections} ariaLabel={dictionary.aboutCompany.sectionsNavAriaLabel} />

        <div className="flex flex-col gap-20 lg:gap-28">
          {orderedSections.map((section) => (
            <section key={section.key} id={SECTION_DOM_ID[section.key]} className="scroll-mt-24">
              {renderSection(section.key)}
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
