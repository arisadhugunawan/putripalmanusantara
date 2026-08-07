import type { Metadata } from "next";
import {
  getDecorativeGraphics,
  getFacilities,
  getFaqs,
  getFeaturedProducts,
  getGallery,
  getHeroSlides,
  getHomepageStatistics,
  getLatestArticles,
  getPartnerLogos,
  getProductionSteps,
  getProducts,
  getPublicSettings,
} from "@/lib/api";
import { AboutSummarySection } from "@/components/home/AboutSummarySection";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { FacilitiesPreview } from "@/components/home/FacilitiesPreview";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
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

// docs/03-design.md §9.1 — homepage section order is final; hero/partners/decorative
// graphics are Post-Launch additions layered onto that same order (see README).
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const [
    statistics,
    featuredProducts,
    productionSteps,
    facilities,
    gallery,
    latestArticles,
    faqs,
    allProducts,
    heroSlides,
    partnerLogos,
    decorativeGraphics,
    settings,
  ] = await Promise.all([
    getHomepageStatistics(locale),
    getFeaturedProducts(locale),
    getProductionSteps(locale),
    getFacilities(locale),
    getGallery(undefined, locale),
    getLatestArticles(locale),
    getFaqs(locale),
    getProducts(locale),
    getHeroSlides(locale),
    getPartnerLogos(locale),
    getDecorativeGraphics("home"),
    getPublicSettings(locale).catch(() => null),
  ]);

  return (
    <main>
      {/* NFR-SEO-01 — FAQPage schema, since FAQ only ever appears on Home (FR-FAQ). */}
      {faqs.length > 0 && <JsonLd data={faqPageJsonLd(faqs)} />}
      <JsonLd data={localBusinessJsonLd(settings, locale)} />

      <HeroSlider slides={heroSlides} decorativeGraphics={decorativeGraphics} />
      <PartnerMarquee logos={partnerLogos} />
      <StatisticsSection statistics={statistics} />
      <AboutSummarySection />
      <WhyChooseUsSection />
      <FeaturedProductsSection products={featuredProducts} />
      <ProductionProcessPreview steps={productionSteps} />
      <FacilitiesPreview facilities={facilities} />
      <GalleryPreview items={gallery} />
      <ArticlesSection articles={latestArticles} />
      <FaqSection faqs={faqs} />
      <QuotationSection products={allProducts} />
    </main>
  );
}
