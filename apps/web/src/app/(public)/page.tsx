import {
  getFacilities,
  getFaqs,
  getFeaturedProducts,
  getGallery,
  getHomepageStatistics,
  getLatestArticles,
  getProductionSteps,
  getProducts,
} from "@/lib/api";
import { AboutSummarySection } from "@/components/home/AboutSummarySection";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { FacilitiesPreview } from "@/components/home/FacilitiesPreview";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Hero } from "@/components/home/Hero";
import { ProductionProcessPreview } from "@/components/home/ProductionProcessPreview";
import { QuotationSection } from "@/components/home/QuotationSection";
import { StatisticsSection } from "@/components/home/StatisticsSection";
import { WhyChooseUsSection } from "@/components/home/WhyChooseUsSection";

// docs/03-design.md §9.1 — homepage section order is final.
export default async function HomePage() {
  const [statistics, featuredProducts, productionSteps, facilities, gallery, latestArticles, faqs, allProducts] =
    await Promise.all([
      getHomepageStatistics(),
      getFeaturedProducts(),
      getProductionSteps(),
      getFacilities(),
      getGallery(),
      getLatestArticles(),
      getFaqs(),
      getProducts(),
    ]);

  return (
    <main>
      <Hero />
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
