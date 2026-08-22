import type { AboutCompanySectionKey } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFacilities, getPageHeader, getPublishedAboutCompany } from "@/lib/api";
import { AboutNav, type AboutSection } from "@/components/about/AboutNav";
import { CompanyProfileSection } from "@/components/about/CompanyProfileSection";
import { TeamSection } from "@/components/about/TeamSection";
import { WhatWeDoSection } from "@/components/about/WhatWeDoSection";
import { LegalCertificateSection } from "@/components/about/LegalCertificateSection";
import { FactorySection } from "@/components/about/FactorySection";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPublishedAboutCompany(locale);
  return buildPageMetadata({
    title: data.settings.seo_title || "About Us",
    description:
      data.settings.seo_description ||
      "CV Putri Palma Nusantara is an Indonesian exporter of coconut-derived products, connecting local producers with international buyers.",
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

const SECTION_LABEL: Record<AboutCompanySectionKey, string> = {
  company: "CV. Putri Palma Nusantara",
  team: "PPN Team",
  what_we_do: "What We Supply",
  legal_certificate: "Legal & Certificate",
  factory: "Factory",
  facilities: "Facilities",
  moq_payment_terms: "MOQ & Payment Terms",
  shipment_terms: "Shipment Terms",
  facilities_faq: "FAQ",
};

// FR-ABOUT-01/02/03/04 — fully CMS-driven via the About Company Manager (Draft/Publish, see
// README "About Company Manager"). Section order/visibility comes from `section_config`.
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const [data, facilities, headerConfig] = await Promise.all([
    getPublishedAboutCompany(locale),
    getFacilities(locale),
    getPageHeader("about-company", locale),
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

  const navSections: AboutSection[] = orderedSections.map((s) => ({
    id: SECTION_DOM_ID[s.key],
    label: SECTION_LABEL[s.key],
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
          />
        );
      case "team":
        return <TeamSection members={data.team_members} section={data.team_section} />;
      case "what_we_do":
        return (
          <WhatWeDoSection
            section={data.what_we_do_section}
            items={data.what_we_do_items}
            whoWeSupplyItems={data.who_we_supply_items}
          />
        );
      case "legal_certificate":
        return (
          <LegalCertificateSection
            documents={data.legal_documents}
            section={data.legal_section}
            categories={data.legal_categories}
          />
        );
      case "factory":
        return <FactorySection factory={data.factory} facilities={facilities} />;
    }
  }

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About Us" }]}
        title={data.settings.page_title || "About CV Putri Palma Nusantara"}
        description={data.settings.page_subtitle || undefined}
        locale={locale}
        headerConfig={headerConfig}
      />

      <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-16 lg:py-20">
        <AboutNav sections={navSections} />

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
