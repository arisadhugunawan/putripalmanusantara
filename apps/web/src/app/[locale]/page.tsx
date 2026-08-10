import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import type { HomepageSectionKey } from "@ppn/shared-types";
import {
  getDecorativeGraphics,
  getFacilities,
  getFeaturedProducts,
  getGallery,
  getLatestArticles,
  getProductionSteps,
  getProducts,
  getPublicSettings,
  getPublishedHomepage,
} from "@/lib/api";
import { AboutPreviewSection } from "@/components/home/AboutPreviewSection";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { ExportReachSection } from "@/components/home/ExportReachSection";
import { FacilitiesPreview } from "@/components/home/FacilitiesPreview";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { GlobalShippingPartnerSection } from "@/components/home/GlobalShippingPartnerSection";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PartnerMarquee } from "@/components/home/PartnerMarquee";
import { ProductionProcessPreview } from "@/components/home/ProductionProcessPreview";
import { QuotationSection } from "@/components/home/QuotationSection";
import { StatisticsSection } from "@/components/home/StatisticsSection";
import { WhyChooseUsSection } from "@/components/home/WhyChooseUsSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLd, localBusinessJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "CV Putri Palma Nusantara — Indonesian Coconut Product Exporter",
    description:
      "CV Putri Palma Nusantara exports Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber to buyers across Asia, the Middle East, and Europe.",
    path: "/",
    locale,
    absoluteTitle: true,
  });
}

// docs/03-design.md §9.1 — homepage section order was originally fixed in JSX; the Homepage
// Manager (Post-Launch) makes it Admin-configurable via `section_config`, defaulting to this
// exact original order. See README "Homepage Manager" — Hero/Partners/About/WhyChooseUs/
// ExportReach/ShippingPartner/Statistics/FAQ come from the published snapshot (Draft/Publish);
// Featured Products/Production Process/Facilities/Gallery/News/Contact CTA are NOT part of the
// Draft/Publish system and stay live-fetched, unchanged from how they've always worked.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const [
    homepage,
    featuredProducts,
    productionSteps,
    facilities,
    gallery,
    latestArticles,
    allProducts,
    decorativeGraphics,
    aboutPreviewGraphics,
    partnersGraphics,
    whyChooseUsGraphics,
    exportReachGraphics,
    shippingPartnersGraphics,
    settings,
  ] = await Promise.all([
    getPublishedHomepage(locale),
    getFeaturedProducts(locale),
    getProductionSteps(locale),
    getFacilities(locale),
    getGallery(undefined, locale),
    getLatestArticles(locale),
    getProducts(locale),
    getDecorativeGraphics("home"),
    getDecorativeGraphics("home-about-preview"),
    getDecorativeGraphics("home-partners"),
    getDecorativeGraphics("home-why-choose-us"),
    getDecorativeGraphics("home-export-reach"),
    getDecorativeGraphics("home-shipping-partners"),
    getPublicSettings(locale).catch(() => null),
  ]);

  const sections: Record<HomepageSectionKey, ReactNode> = {
    hero_slider: <HeroSlider slides={homepage.hero_slides} decorativeGraphics={decorativeGraphics} />,
    partners: (
      <PartnerMarquee
        section={homepage.partners_section}
        logos={homepage.partner_logos}
        decorativeGraphics={partnersGraphics}
      />
    ),
    about_company: (
      <AboutPreviewSection
        preview={homepage.about_preview}
        highlights={homepage.highlights}
        decorativeGraphics={aboutPreviewGraphics}
      />
    ),
    statistics: <StatisticsSection statistics={homepage.statistics} />,
    why_choose_us: <WhyChooseUsSection items={homepage.why_choose_us} decorativeGraphics={whyChooseUsGraphics} />,
    featured_products: <FeaturedProductsSection products={featuredProducts} />,
    production_process: <ProductionProcessPreview steps={productionSteps} />,
    facilities: <FacilitiesPreview facilities={facilities} />,
    gallery: <GalleryPreview items={gallery} />,
    news_articles: <ArticlesSection articles={latestArticles} />,
    export_reach: (
      <ExportReachSection
        section={homepage.export_reach_section}
        destinations={homepage.export_destinations}
        decorativeGraphics={exportReachGraphics}
      />
    ),
    shipping_partner: (
      <GlobalShippingPartnerSection
        section={homepage.shipping_section}
        partners={homepage.shipping_partners}
        decorativeGraphics={shippingPartnersGraphics}
      />
    ),
    faq: <FaqSection faqs={homepage.faqs} />,
    contact_cta: <QuotationSection products={allProducts} />,
  };

  const orderedSections = [...homepage.section_config]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <main>
      {/* NFR-SEO-01 — FAQPage schema, since FAQ only ever appears on Home (FR-FAQ). */}
      {homepage.faqs.length > 0 && <JsonLd data={faqPageJsonLd(homepage.faqs)} />}
      <JsonLd data={localBusinessJsonLd(settings, locale)} />

      {orderedSections.map((section) => (
        <Fragment key={section.key}>{sections[section.key]}</Fragment>
      ))}
    </main>
  );
}
