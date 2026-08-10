"use client";

import type {
  ArticleSummary,
  DecorativeGraphic,
  ExportDestination,
  Facility,
  Faq,
  GalleryItem,
  HeroSlide,
  HomepageAboutPreview,
  HomepageExportReach,
  HomepageHighlight,
  HomepagePartnersSection,
  HomepageSectionConfig,
  HomepageSectionKey,
  HomepageShippingSection,
  HomepageStatistic,
  HomepageWhyChooseUs,
  PartnerLogo,
  ProductSummary,
  ProductionStep,
  ShippingPartner,
} from "@ppn/shared-types";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin/client";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Public GET endpoints read live tables with the same `publicOnly` filters as production
 * always has — no auth needed, same as any real visitor's request. Only section order/
 * visibility needs the admin endpoint, since a hidden/reordered section is itself draft state
 * a real visitor should never see. */
async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  const json = (await res.json()) as { data: T };
  return json.data;
}

interface PreviewData {
  sectionConfig: HomepageSectionConfig[];
  heroSlides: HeroSlide[];
  partnersSection: HomepagePartnersSection;
  partnerLogos: PartnerLogo[];
  aboutPreview: HomepageAboutPreview;
  highlights: HomepageHighlight[];
  whyChooseUs: HomepageWhyChooseUs[];
  exportReachSection: HomepageExportReach;
  exportDestinations: ExportDestination[];
  shippingSection: HomepageShippingSection;
  shippingPartners: ShippingPartner[];
  statistics: HomepageStatistic[];
  faqs: Faq[];
  featuredProducts: ProductSummary[];
  productionSteps: ProductionStep[];
  facilities: Facility[];
  gallery: GalleryItem[];
  latestArticles: ArticleSummary[];
  allProducts: ProductSummary[];
  decorativeGraphics: DecorativeGraphic[];
  aboutPreviewGraphics: DecorativeGraphic[];
  partnersGraphics: DecorativeGraphic[];
  whyChooseUsGraphics: DecorativeGraphic[];
  exportReachGraphics: DecorativeGraphic[];
  shippingPartnersGraphics: DecorativeGraphic[];
}

/**
 * Draft preview — always renders the *current unpublished* Admin state (deliberately
 * duplicating the aggregation `[locale]/page.tsx` used before the Draft/Publish snapshot
 * cutover), so it stays fully decoupled from what real visitors see. Never affects the public
 * site: it only ever reads, never writes, and reads a different data path entirely (live
 * tables here vs. the frozen `HomepagePublishedSnapshot` in production).
 */
export default function HomepagePreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [
          sectionConfig,
          heroSlides,
          partnersSection,
          partnerLogos,
          aboutPreview,
          highlights,
          whyChooseUs,
          exportReachSection,
          exportDestinations,
          shippingSection,
          shippingPartners,
          statistics,
          faqs,
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
        ] = await Promise.all([
          adminApi.get<HomepageSectionConfig[]>("/admin/homepage/sections"),
          publicGet<HeroSlide[]>("/homepage/hero-slides"),
          publicGet<HomepagePartnersSection>("/homepage/partners-section"),
          publicGet<PartnerLogo[]>("/homepage/partner-logos"),
          publicGet<HomepageAboutPreview>("/homepage/about-preview"),
          publicGet<HomepageHighlight[]>("/homepage/highlights"),
          publicGet<HomepageWhyChooseUs[]>("/homepage/why-choose-us"),
          publicGet<HomepageExportReach>("/homepage/export-reach-section"),
          publicGet<ExportDestination[]>("/homepage/export-destinations"),
          publicGet<HomepageShippingSection>("/homepage/shipping-section"),
          publicGet<ShippingPartner[]>("/homepage/shipping-partners"),
          publicGet<HomepageStatistic[]>("/homepage/statistics"),
          publicGet<Faq[]>("/faqs"),
          publicGet<ProductSummary[]>("/products/featured"),
          publicGet<ProductionStep[]>("/production-steps"),
          publicGet<Facility[]>("/facilities"),
          publicGet<GalleryItem[]>("/gallery"),
          publicGet<ArticleSummary[]>("/articles/latest"),
          publicGet<ProductSummary[]>("/products"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-about-preview"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-partners"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-why-choose-us"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-export-reach"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-shipping-partners"),
        ]);
        setData({
          sectionConfig,
          heroSlides,
          partnersSection,
          partnerLogos,
          aboutPreview,
          highlights,
          whyChooseUs,
          exportReachSection,
          exportDestinations,
          shippingSection,
          shippingPartners,
          statistics,
          faqs,
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
          <strong>Draft Preview</strong> — menampilkan perubahan yang belum dipublikasikan. Pengunjung situs tidak melihat ini.
        </span>
        <Link href="/admin/homepage" className="font-medium underline">
          ← Kembali ke Homepage Manager
        </Link>
      </div>

      {error && <p className="p-8 text-center text-body text-red-600">Gagal memuat preview. Silakan coba lagi.</p>}
      {!error && !data && <p className="p-8 text-center text-body text-neutral-500">Memuat preview...</p>}

      {data && (
        <main>
          {[...data.sectionConfig]
            .filter((s) => s.visible)
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <Fragment key={section.key}>{renderSection(section.key, data)}</Fragment>
            ))}
        </main>
      )}
    </div>
  );
}

function renderSection(key: HomepageSectionKey, data: PreviewData) {
  switch (key) {
    case "hero_slider":
      return <HeroSlider slides={data.heroSlides} decorativeGraphics={data.decorativeGraphics} />;
    case "partners":
      return (
        <PartnerMarquee section={data.partnersSection} logos={data.partnerLogos} decorativeGraphics={data.partnersGraphics} />
      );
    case "about_company":
      return (
        <AboutPreviewSection
          preview={data.aboutPreview}
          highlights={data.highlights}
          decorativeGraphics={data.aboutPreviewGraphics}
        />
      );
    case "statistics":
      return <StatisticsSection statistics={data.statistics} />;
    case "why_choose_us":
      return <WhyChooseUsSection items={data.whyChooseUs} decorativeGraphics={data.whyChooseUsGraphics} />;
    case "featured_products":
      return <FeaturedProductsSection products={data.featuredProducts} />;
    case "production_process":
      return <ProductionProcessPreview steps={data.productionSteps} />;
    case "facilities":
      return <FacilitiesPreview facilities={data.facilities} />;
    case "gallery":
      return <GalleryPreview items={data.gallery} />;
    case "news_articles":
      return <ArticlesSection articles={data.latestArticles} />;
    case "export_reach":
      return (
        <ExportReachSection
          section={data.exportReachSection}
          destinations={data.exportDestinations}
          decorativeGraphics={data.exportReachGraphics}
        />
      );
    case "shipping_partner":
      return (
        <GlobalShippingPartnerSection
          section={data.shippingSection}
          partners={data.shippingPartners}
          decorativeGraphics={data.shippingPartnersGraphics}
        />
      );
    case "faq":
      return <FaqSection faqs={data.faqs} />;
    case "contact_cta":
      return <QuotationSection products={data.allProducts} />;
    default:
      return null;
  }
}
