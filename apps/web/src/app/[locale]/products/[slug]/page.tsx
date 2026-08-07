import { Card, Container } from "@ppn/ui-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getPublicSettings } from "@/lib/api";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { ApplicationCards } from "@/components/products/catalogue/ApplicationCards";
import { InfoCardGrid } from "@/components/products/catalogue/InfoCardGrid";
import { PackagingCards } from "@/components/products/catalogue/PackagingCards";
import { ProductImageViewer } from "@/components/products/catalogue/ProductImageViewer";
import { ProductQuickActions } from "@/components/products/catalogue/ProductQuickActions";
import { ProductSidebarNav } from "@/components/products/catalogue/ProductSidebarNav";
import { RelatedProducts } from "@/components/products/catalogue/RelatedProducts";
import { PageHeader } from "@/components/page/PageHeader";
import { QuotationForm } from "@/components/forms/QuotationForm";
import { JsonLd } from "@/components/seo/JsonLd";
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
  const [product, allProducts, settings] = await Promise.all([
    getProductBySlug(slug, locale),
    getProducts(locale),
    getPublicSettings(locale).catch(() => null),
  ]);
  if (!product) notFound();

  const specCards = product.specifications
    .filter((spec) => spec.group !== "export_info")
    .map((spec) => ({ id: spec.id, label: spec.spec_key, value: spec.spec_value }));
  const exportInfoCards = product.specifications
    .filter((spec) => spec.group === "export_info")
    .map((spec) => ({ id: spec.id, label: spec.spec_key, value: spec.spec_value }));
  const relatedProducts = allProducts.filter((p) => p.id !== product.id);

  return (
    <main>
      <JsonLd data={productJsonLd(product, locale)} />

      {/* Section 1 — Banner */}
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        title={product.name}
        description={product.short_description}
        locale={locale}
      />

      <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-16 lg:py-20">
        <ProductSidebarNav products={allProducts} currentSlug={product.slug} eyebrow="Our Products" />

        <div className="flex flex-col gap-16 lg:gap-20">
          {/* Section 2 — Product Overview */}
          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="sr-only">
              Product Overview
            </h2>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
              <ProductImageViewer
                items={product.gallery.map((item) => ({ id: item.id, media: item.media }))}
                fallback={product.cover_image}
              />

              <div>
                {/* Section 3 — Quick Action */}
                <ProductQuickActions
                  productName={product.name}
                  downloads={product.downloads}
                  whatsappNumber={settings?.whatsapp_number}
                />

                {/* Section 4 — Description */}
                <h2 className="mt-10 text-h2 text-neutral-900">Description</h2>
                <p className="mt-4 text-body-lg text-neutral-600">{product.full_description}</p>
              </div>
            </div>
          </section>

          {/* Section 5 — Specifications */}
          {specCards.length > 0 && (
            <section aria-labelledby="specifications-heading">
              <h2 id="specifications-heading" className="text-h2 text-neutral-900">
                Specifications
              </h2>
              <InfoCardGrid items={specCards} className="mt-6" />
            </section>
          )}

          {/* Section 6 — Product Gallery */}
          {product.gallery.length > 0 && (
            <section aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="text-h2 text-neutral-900">
                Product Gallery
              </h2>
              <div className="mt-6">
                <GalleryGrid items={product.gallery.map((item) => ({ id: item.id, media: item.media }))} />
              </div>
            </section>
          )}

          {/* Section 7 — Packaging */}
          {product.packaging.length > 0 && (
            <section aria-labelledby="packaging-heading">
              <h2 id="packaging-heading" className="text-h2 text-neutral-900">
                Packaging
              </h2>
              <div className="mt-6">
                <PackagingCards items={product.packaging} />
              </div>
            </section>
          )}

          {/* Section 8 — Applications */}
          {product.applications.length > 0 && (
            <section aria-labelledby="applications-heading">
              <h2 id="applications-heading" className="text-h2 text-neutral-900">
                Applications
              </h2>
              <div className="mt-6">
                <ApplicationCards items={product.applications} />
              </div>
            </section>
          )}

          {/* Section 9 — Export Information */}
          {exportInfoCards.length > 0 && (
            <section aria-labelledby="export-info-heading">
              <h2 id="export-info-heading" className="text-h2 text-neutral-900">
                Export Information
              </h2>
              <InfoCardGrid items={exportInfoCards} className="mt-6" />
            </section>
          )}

          {/* Section 10 — Related Products */}
          {relatedProducts.length > 0 && (
            <section aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-h2 text-neutral-900">
                You may also be interested in
              </h2>
              <div className="mt-6">
                <RelatedProducts products={relatedProducts} />
              </div>
            </section>
          )}

          {/* Request Quotation — target of the Quick Action button (#quotation) */}
          <section id="quotation" className="scroll-mt-24" aria-labelledby="quotation-heading">
            <h2 id="quotation-heading" className="text-h2 text-neutral-900">
              Request a Quotation
            </h2>
            <p className="mt-2 max-w-xl text-body-lg text-neutral-600">
              Interested in {product.name}? Tell us your requirements below.
            </p>
            <Card className="mt-8">
              <QuotationForm
                sourcePage={`/products/${product.slug}`}
                productId={product.id}
                productName={product.name}
              />
            </Card>
          </section>
        </div>
      </Container>
    </main>
  );
}
