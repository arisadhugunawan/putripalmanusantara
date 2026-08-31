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
  HomepageProcessSection,
  HomepageSectionConfig,
  HomepageSectionKey,
  HomepageShippingSection,
  HomepageStatistic,
  HomepageSupplyNetworkSection,
  PartnerLogo,
  ProductSummary,
  ProductionStep,
  ShippingPartner,
  SupplyNetworkConnection,
  SupplyNetworkCountry,
  SupplyNetworkItem,
} from "@ppn/shared-types";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin/client";
// Client component — can't call the server-only `getDictionary()` — and this preview always
// shows the default-locale (English) content anyway (no `?locale=` is ever sent to the public
// GET endpoints below), so importing the English dictionary module directly matches exactly
// what's already being previewed.
import enDictionary from "@/i18n/dictionaries/en";
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
  supplyNetworkItems: SupplyNetworkItem[];
  supplyNetworkConnections: SupplyNetworkConnection[];
  supplyNetworkCountries: SupplyNetworkCountry[];
  supplyNetworkSection: HomepageSupplyNetworkSection;
  exportReachSection: HomepageExportReach;
  exportDestinations: ExportDestination[];
  shippingSection: HomepageShippingSection;
  shippingPartners: ShippingPartner[];
  statistics: HomepageStatistic[];
  faqs: Faq[];
  featuredProducts: ProductSummary[];
  productionSteps: ProductionStep[];
  processSection: HomepageProcessSection;
  facilities: Facility[];
  gallery: GalleryItem[];
  latestArticles: ArticleSummary[];
  allProducts: ProductSummary[];
  decorativeGraphics: DecorativeGraphic[];
  aboutPreviewGraphics: DecorativeGraphic[];
  partnersGraphics: DecorativeGraphic[];
  supplyNetworkGraphics: DecorativeGraphic[];
  exportReachGraphics: DecorativeGraphic[];
  shippingPartnersGraphics: DecorativeGraphic[];
  productionProcessGraphics: DecorativeGraphic[];
  productsGraphics: DecorativeGraphic[];
  facilitiesGraphics: DecorativeGraphic[];
  galleryGraphics: DecorativeGraphic[];
  articlesGraphics: DecorativeGraphic[];
  faqGraphics: DecorativeGraphic[];
  quotationGraphics: DecorativeGraphic[];
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
          supplyNetworkItemsRaw,
          supplyNetworkConnections,
          supplyNetworkCountriesRaw,
          supplyNetworkSection,
          exportReachSection,
          exportDestinations,
          shippingSection,
          shippingPartners,
          statistics,
          faqs,
          featuredProducts,
          productionStepsRaw,
          processSection,
          facilitiesRaw,
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
        ] = await Promise.all([
          adminApi.get<HomepageSectionConfig[]>("/admin/homepage/sections"),
          publicGet<HeroSlide[]>("/homepage/hero-slides"),
          publicGet<HomepagePartnersSection>("/homepage/partners-section"),
          publicGet<PartnerLogo[]>("/homepage/partner-logos"),
          publicGet<HomepageAboutPreview>("/homepage/about-preview"),
          publicGet<HomepageHighlight[]>("/homepage/highlights"),
          // No public list endpoint for Our Supply Network — it's snapshot-gated (see
          // `supply-network.module.ts`), so the admin (unfiltered) endpoint is read here and
          // the same `active` filter `buildSnapshotPayload()` uses is re-applied below.
          adminApi.get<SupplyNetworkItem[]>("/admin/supply-network"),
          adminApi.get<SupplyNetworkConnection[]>("/admin/supply-network/connections"),
          adminApi.get<SupplyNetworkCountry[]>("/admin/supply-network/countries"),
          adminApi.get<HomepageSupplyNetworkSection>("/admin/supply-network/section"),
          publicGet<HomepageExportReach>("/homepage/export-reach-section"),
          publicGet<ExportDestination[]>("/homepage/export-destinations"),
          publicGet<HomepageShippingSection>("/homepage/shipping-section"),
          publicGet<ShippingPartner[]>("/homepage/shipping-partners"),
          publicGet<HomepageStatistic[]>("/homepage/statistics"),
          publicGet<Faq[]>("/faqs"),
          publicGet<ProductSummary[]>("/products/featured"),
          // No public list endpoint for Production Process — it's snapshot-gated now (see
          // `production-steps.module.ts`), so the admin (unfiltered) endpoint is read here and
          // the same `active` filter `buildSnapshotPayload()` uses is re-applied below.
          adminApi.get<ProductionStep[]>("/admin/production-steps"),
          adminApi.get<HomepageProcessSection>("/admin/production-steps/section"),
          // No public list endpoint for Facilities — it moved under the About Company
          // Draft/Publish snapshot (see README "About Company → Facilities"), so the admin
          // (unfiltered) endpoint is read here and the same `active` filter the public site
          // uses is re-applied below, matching the Production Process pattern above.
          adminApi.get<Facility[]>("/admin/about-company/facilities"),
          publicGet<GalleryItem[]>("/gallery"),
          publicGet<ArticleSummary[]>("/articles/latest"),
          publicGet<ProductSummary[]>("/products"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-about-preview"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-partners"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-supply-network"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-export-reach"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-shipping-partners"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-production-process"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-products"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-facilities"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-gallery"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-articles"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-faq"),
          publicGet<DecorativeGraphic[]>("/homepage/decorative-graphics?page=home-quotation"),
        ]);
        setData({
          sectionConfig,
          heroSlides,
          partnersSection,
          partnerLogos,
          aboutPreview,
          highlights,
          supplyNetworkItems: [...supplyNetworkItemsRaw].filter((i) => i.active).sort((a, b) => a.order - b.order),
          supplyNetworkConnections,
          supplyNetworkCountries: [...supplyNetworkCountriesRaw].filter((c) => c.active).sort((a, b) => a.order - b.order),
          supplyNetworkSection,
          exportReachSection,
          exportDestinations,
          shippingSection,
          shippingPartners,
          statistics,
          faqs,
          featuredProducts,
          productionSteps: [...productionStepsRaw].filter((s) => s.active).sort((a, b) => a.order - b.order),
          processSection,
          facilities: [...facilitiesRaw].filter((f) => f.active).sort((a, b) => a.order - b.order),
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
      return (
        <HeroSlider slides={data.heroSlides} decorativeGraphics={data.decorativeGraphics} dictionary={enDictionary} />
      );
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
          dictionary={enDictionary}
        />
      );
    case "statistics":
      return <StatisticsSection statistics={data.statistics} />;
    case "why_choose_us":
      return (
        <SupplyNetworkSection
          section={data.supplyNetworkSection}
          items={data.supplyNetworkItems}
          connections={data.supplyNetworkConnections}
          countries={data.supplyNetworkCountries}
          decorativeGraphics={data.supplyNetworkGraphics}
        />
      );
    case "featured_products":
      return (
        <FeaturedProductsSection
          products={data.featuredProducts}
          decorativeGraphics={data.productsGraphics}
          dictionary={enDictionary}
        />
      );
    case "production_process":
      return (
        <ProcessSection
          section={data.processSection}
          steps={data.productionSteps}
          decorativeGraphics={data.productionProcessGraphics}
        />
      );
    case "facilities":
      return (
        <FacilitiesPreview facilities={data.facilities} decorativeGraphics={data.facilitiesGraphics} dictionary={enDictionary} />
      );
    case "gallery":
      return <GalleryPreview items={data.gallery} decorativeGraphics={data.galleryGraphics} dictionary={enDictionary} />;
    case "news_articles":
      return (
        <ArticlesSection
          articles={data.latestArticles}
          decorativeGraphics={data.articlesGraphics}
          dictionary={enDictionary}
          locale="en"
        />
      );
    case "export_reach":
      return (
        <ExportReachSection
          section={data.exportReachSection}
          destinations={data.exportDestinations}
          decorativeGraphics={data.exportReachGraphics}
          dictionary={enDictionary}
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
      return <FaqSection faqs={data.faqs} decorativeGraphics={data.faqGraphics} dictionary={enDictionary} />;
    case "contact_cta":
      return (
        <QuotationSection products={data.allProducts} decorativeGraphics={data.quotationGraphics} dictionary={enDictionary} />
      );
    default:
      return null;
  }
}
