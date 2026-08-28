import { Container } from "@ppn/ui-components";
import type { Locale } from "@ppn/shared-types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageHeader, getProductBySlug, getProducts, getPublicContactPage } from "@/lib/api";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { ApplicationCards } from "@/components/products/catalogue/ApplicationCards";
import { DeliveryPackagingFooter } from "@/components/products/catalogue/DeliveryPackagingFooter";
import { InfoCardGrid } from "@/components/products/catalogue/InfoCardGrid";
import { PackagingCards } from "@/components/products/catalogue/PackagingCards";
import { ProductSpecSheet } from "@/components/products/catalogue/ProductSpecSheet";
import { ProductImageViewer } from "@/components/products/catalogue/ProductImageViewer";
import { ProductQuickActions } from "@/components/products/catalogue/ProductQuickActions";
import { ProductSidebarNav } from "@/components/products/catalogue/ProductSidebarNav";
import { DetailInformationTable, ShapeSizeGrid } from "@/components/products/catalogue/ShapeSizeGrid";
import { SpecLabDocuments } from "@/components/products/catalogue/SpecLabDocuments";
import { RelatedProducts } from "@/components/products/catalogue/RelatedProducts";
import { PageHeader } from "@/components/page/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/get-dictionary";
import { productJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProductBySlug(slug, locale);
  if (!product) return {};
  return buildPageMetadata({
    title: product.meta_title || product.name,
    description: product.meta_description || product.short_description,
    path: `/products/${product.slug}`,
    locale,
    imageUrl: product.cover_image?.file_url,
  });
}

/**
 * Premium B2B product catalogue page — sticky product sidebar + 10 sections (banner,
 * overview slider, quick actions, description, spec cards, gallery, packaging cards,
 * application cards, export info cards, related products). Scoped to /products only —
 * see README for the redesign brief this implements.
 */
export default async function ProductDetailPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { slug, locale } = await params;
  const [product, allProducts, contactPage, headerConfig, dictionary] = await Promise.all([
    getProductBySlug(slug, locale),
    getProducts(locale),
    getPublicContactPage(locale).catch(() => null),
    getPageHeader("product-detail", locale),
    getDictionary(locale as Locale),
  ]);
  if (!product) notFound();
  const t = dictionary.products;

  // Product media is one CMS collection split by placement: the rail/gallery show ordinary
  // media (images and videos), while `spec_lab` items are the specification sheet and lab
  // report scans rendered in their own section. `?? "gallery"` keeps products saved before the
  // placement field existed rendering exactly as they did.
  // `?? []` on every collection: at build time Next serves these routes from its fetch cache,
  // which can still hold a response captured before a field existed. Reading `.length` off an
  // absent key there fails the whole production build, so the page must tolerate an older
  // payload and simply render that section empty.
  const gallery = product.gallery ?? [];
  const shapes = product.shapes ?? [];
  const specifications = product.specifications ?? [];
  const packaging = product.packaging ?? [];
  const applications = product.applications ?? [];
  const downloads = product.downloads ?? [];

  const galleryItems = gallery.filter((item) => (item.section ?? "gallery") === "gallery");
  const specLabItems = gallery.filter((item) => item.section === "spec_lab");

  const detailInfoRows = specifications
    .filter((spec) => spec.group === "detail_info")
    .map((spec) => ({ id: spec.id, label: spec.spec_key, value: spec.spec_value }));

  // Explicit allow-list, not "everything except export_info": with a third group now in the
  // enum, a negative filter would silently leak Detail Information rows into this section too.
  const specCards = specifications
    .filter((spec) => spec.group === "specification")
    .map((spec) => ({
      id: spec.id,
      label: spec.spec_key,
      value: spec.spec_value,
      variantLabel: spec.variant_label,
    }));
  const exportInfoCards = specifications
    .filter((spec) => spec.group === "export_info")
    .map((spec) => ({ id: spec.id, label: spec.spec_key, value: spec.spec_value }));
  const relatedProducts = allProducts.filter((p) => p.id !== product.id);

  return (
    <main>
      <JsonLd data={productJsonLd(product, locale)} />

      {/* Section 1 — Banner */}
      <PageHeader
        breadcrumb={[
          { label: dictionary.nav.home, href: "/" },
          { label: t.breadcrumbProducts, href: "/products" },
          { label: product.name },
        ]}
        title={product.name}
        titleAccent={product.title_accent}
        description={product.short_description}
        locale={locale}
        headerConfig={headerConfig}
      />

      <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-16 lg:py-20">
        <ProductSidebarNav products={allProducts} currentSlug={product.slug} eyebrow={t.eyebrow} />

        <div className="flex flex-col gap-16 lg:gap-20">
          {/* Section 2 — Product Overview */}
          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="sr-only">
              {t.overview}
            </h2>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
              <ProductImageViewer
                items={galleryItems.map((item) => ({ id: item.id, media: item.media }))}
                fallback={product.cover_image}
              />

              <div className="flex flex-col">
                {/* Section 3 — Quick Action. Desktop only: reordered below the Description
                    (lg:order-2) so a buyer reads what the product is before being offered the
                    catalogue/WhatsApp actions — mobile keeps the original actions-first order,
                    since there `order` is left unset (source order = DOM order). */}
                <div className="lg:order-2 lg:mt-8">
                  <ProductQuickActions
                    productName={product.name}
                    downloads={downloads}
                    whatsappNumber={contactPage?.settings.whatsapp_number}
                    catalogueLabel={t.catalogue}
                    whatsappMessageTemplate={t.whatsappMessageTemplate}
                  />
                </div>

                {/* Section 4 — Description */}
                <div className="lg:order-1">
                  <h2 className="mt-10 text-h2 text-neutral-900 lg:mt-0">{t.description}</h2>
                  <p className="mt-4 text-body-lg text-neutral-600">{product.full_description}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 — Specifications */}
          {specCards.length > 0 && (
            <section aria-labelledby="specifications-heading" className="flex flex-col gap-6">
              <h2 id="specifications-heading" className="sr-only">
                {t.specifications}
              </h2>
              <FadeUpSection>
                <ProductSpecSheet items={specCards} heading={t.specifications} />
              </FadeUpSection>
              <FadeUpSection style={{ transitionDelay: "100ms" }}>
                <DeliveryPackagingFooter
                  deliveryTermsLabel={t.deliveryTerms}
                  packagingLabel={t.packaging}
                  packagingOptionLabels={[
                    t.packagingJuteGunnyBags,
                    t.packagingPolypropyleneBags,
                    t.packagingPlasticNettedBags,
                  ]}
                />
              </FadeUpSection>
            </section>
          )}

          {/* Section 5a — Shape & Size */}
          {shapes.length > 0 && (
            <section aria-labelledby="shape-size-heading">
              <h2 id="shape-size-heading" className="text-h2 text-neutral-900">
                {t.shapeAndSize}
              </h2>
              <div className="mt-6">
                <ShapeSizeGrid shapes={shapes} />
              </div>
            </section>
          )}

          {/* Section 5b — Specification & Lab. Test documents (CMS placement `spec_lab`) */}
          {specLabItems.length > 0 && (
            <section aria-labelledby="spec-lab-heading">
              <h2 id="spec-lab-heading" className="text-h2 text-neutral-900">
                {t.specLabTest}
              </h2>
              <div className="mt-6">
                <SpecLabDocuments items={specLabItems} />
              </div>
            </section>
          )}

          {/* Section 6 — Product Gallery */}
          {galleryItems.length > 0 && (
            <section aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="text-h2 text-neutral-900">
                {t.productGallery}
              </h2>
              <div className="mt-6">
                <GalleryGrid items={galleryItems.map((item) => ({ id: item.id, media: item.media }))} />
              </div>
            </section>
          )}

          {/* Section 6b — Detail Information */}
          {detailInfoRows.length > 0 && (
            <section aria-labelledby="detail-info-heading">
              <h2 id="detail-info-heading" className="text-h2 text-neutral-900">
                {t.detailInformation}
              </h2>
              <div className="mt-6">
                <DetailInformationTable rows={detailInfoRows} />
              </div>
            </section>
          )}

          {/* Section 7 — Packaging */}
          {packaging.length > 0 && (
            <section aria-labelledby="packaging-heading">
              <h2 id="packaging-heading" className="text-h2 text-neutral-900">
                {t.packaging}
              </h2>
              <div className="mt-6">
                <PackagingCards items={packaging} />
              </div>
            </section>
          )}

          {/* Section 8 — Applications */}
          {applications.length > 0 && (
            <section aria-labelledby="applications-heading">
              <h2 id="applications-heading" className="text-h2 text-neutral-900">
                {t.applications}
              </h2>
              <div className="mt-6">
                <ApplicationCards items={applications} />
              </div>
            </section>
          )}

          {/* Section 9 — Export Information */}
          {exportInfoCards.length > 0 && (
            <section aria-labelledby="export-info-heading">
              <h2 id="export-info-heading" className="text-h2 text-neutral-900">
                {t.exportInformation}
              </h2>
              <InfoCardGrid items={exportInfoCards} className="mt-6" />
            </section>
          )}

          {/* Section 10 — Related Products */}
          {relatedProducts.length > 0 && (
            <section aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-h2 text-neutral-900">
                {t.relatedProducts}
              </h2>
              <div className="mt-6">
                <RelatedProducts products={relatedProducts} />
              </div>
            </section>
          )}

        </div>
      </Container>
    </main>
  );
}
