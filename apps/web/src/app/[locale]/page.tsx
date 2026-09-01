import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import type { HomepageSectionKey, Locale } from "@ppn/shared-types";
import {
  getDecorativeGraphics,
  getFacilities,
  getFeaturedProducts,
  getGallery,
  getLatestArticles,
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
import { ProcessSection } from "@/components/home/process/ProcessSection";
import { QuotationSection } from "@/components/home/QuotationSection";
import { StatisticsSection } from "@/components/home/StatisticsSection";
import { SupplyNetworkSection } from "@/components/home/supply-network/SupplyNetworkSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/get-dictionary";
import { faqPageJsonLd, localBusinessJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  // Same `getPublicSettings` call the page body below already makes (line ~95) — Next.js
  // dedupes identical `fetch()` calls made during one render pass (see `request()` in
  // `lib/api.ts`, which sets `next: { revalidate }`), so this costs no second round-trip in
  // practice; the Product/Article detail pages already rely on the same dedup for their own
  // `generateMetadata`. `default_meta_title`/`default_meta_description` are the CMS's
  // purpose-built SEO fields for this exact page (seeded with this exact English text) and are
  // already locale-resolved via `translate()` on the backend — the `||` fallback preserves
  // today's exact English copy for any locale without an admin-entered override, per the
  // established CMS-field-with-fallback pattern used by every other page's metadata.
  const settings = await getPublicSettings(locale).catch(() => null);
  return buildPageMetadata({
    title:
      settings?.default_meta_title ||
      "CV Putri Palma Nusantara — Indonesian Coconut Product Exporter",
    description:
      settings?.default_meta_description ||
      "CV Putri Palma Nusantara exports Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber to buyers across Asia, the Middle East, and Europe.",
    path: "/",
    locale,
    absoluteTitle: true,
  });
}

// docs/03-design.md §9.1 — homepage section order was originally fixed in JSX; the Homepage
// Manager (Post-Launch) makes it Admin-configurable via `section_config`, defaulting to this
// exact original order. See README "Homepage Manager" — Hero/Partners/About/Our Supply Network/
// ExportReach/ShippingPartner/Statistics/FAQ/Production Process come from the published
// snapshot (Draft/Publish); Featured Products/Facilities/Gallery/News/Contact CTA are NOT part
// of the Draft/Publish system and stay live-fetched, unchanged from how they've always worked.
// The `why_choose_us` section key is unchanged (avoids a HomepageSectionConfig migration) but
// now renders "Our Supply Network" — see README for why the old section was replaced in place.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  // `[locale]/layout.tsx` already 404s on an unrecognized locale segment before this page ever
  // renders — same as that layout's own `resolvedLocale`, this cast just satisfies the type
  // system for the one call below (`getDictionary`) that requires `Locale`, not a plain string.
  const resolvedLocale = locale as Locale;
  const [
    dictionary,
    homepage,
    featuredProducts,
    facilities,
    gallery,
    latestArticles,
    allProducts,
    decorativeGraphics,
    aboutPreviewGraphics,
    partnersGraphics,
    supplyNetworkGraphics,
    exportReachGraphics,
    shippingPartnersGraphics,
    productionProcessGraphics,
    productsGraphics,
    facilitiesGraphics,
    galleryGraphics,
    articlesGraphics,
    faqGraphics,
    quotationGraphics,
    settings,
  ] = await Promise.all([
    getDictionary(resolvedLocale),
    getPublishedHomepage(locale),
    getFeaturedProducts(locale),
    getFacilities(locale),
    getGallery(undefined, locale),
    getLatestArticles(locale),
    getProducts(locale),
    getDecorativeGraphics("home"),
    getDecorativeGraphics("home-about-preview"),
    getDecorativeGraphics("home-partners"),
    getDecorativeGraphics("home-supply-network"),
    getDecorativeGraphics("home-export-reach"),
    getDecorativeGraphics("home-shipping-partners"),
    getDecorativeGraphics("home-production-process"),
    getDecorativeGraphics("home-products"),
    getDecorativeGraphics("home-facilities"),
    getDecorativeGraphics("home-gallery"),
    getDecorativeGraphics("home-articles"),
    getDecorativeGraphics("home-faq"),
    getDecorativeGraphics("home-quotation"),
    getPublicSettings(locale).catch(() => null),
  ]);

  const sections: Record<HomepageSectionKey, ReactNode> = {
    hero_slider: (
      <HeroSlider slides={homepage.hero_slides} decorativeGraphics={decorativeGraphics} dictionary={dictionary} />
    ),
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
        dictionary={dictionary}
      />
    ),
    statistics: <StatisticsSection statistics={homepage.statistics} />,
    why_choose_us: (
      <SupplyNetworkSection
        section={homepage.supply_network_section}
        items={homepage.supply_network_items}
        connections={homepage.supply_network_connections}
        countries={homepage.supply_network_countries}
        decorativeGraphics={supplyNetworkGraphics}
      />
    ),
    featured_products: (
      <FeaturedProductsSection products={featuredProducts} decorativeGraphics={productsGraphics} dictionary={dictionary} />
    ),
    production_process: (
      <ProcessSection
        section={homepage.process_section}
        steps={homepage.production_steps}
        decorativeGraphics={productionProcessGraphics}
      />
    ),
    facilities: (
      <FacilitiesPreview facilities={facilities} decorativeGraphics={facilitiesGraphics} dictionary={dictionary} />
    ),
    gallery: <GalleryPreview items={gallery} decorativeGraphics={galleryGraphics} dictionary={dictionary} />,
    news_articles: (
      <ArticlesSection
        articles={latestArticles}
        decorativeGraphics={articlesGraphics}
        dictionary={dictionary}
        locale={resolvedLocale}
      />
    ),
    export_reach: (
      <ExportReachSection
        section={homepage.export_reach_section}
        destinations={homepage.export_destinations}
        decorativeGraphics={exportReachGraphics}
        dictionary={dictionary}
      />
    ),
    shipping_partner: (
      <GlobalShippingPartnerSection
        section={homepage.shipping_section}
        partners={homepage.shipping_partners}
        decorativeGraphics={shippingPartnersGraphics}
        dictionary={dictionary}
      />
    ),
    faq: <FaqSection faqs={homepage.faqs} decorativeGraphics={faqGraphics} dictionary={dictionary} />,
    contact_cta: (
      <QuotationSection products={allProducts} decorativeGraphics={quotationGraphics} dictionary={dictionary} />
    ),
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
