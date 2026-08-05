import { Card, Container, Section, buttonVariants } from "@ppn/ui-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/api";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { PageHeader } from "@/components/page/PageHeader";
import { QuotationForm } from "@/components/forms/QuotationForm";
import { SafeImage } from "@/components/SafeImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return buildPageMetadata({
    title: product.meta_title || product.name,
    description: product.meta_description || product.short_description,
    path: `/products/${product.slug}`,
    imageUrl: product.cover_image?.file_url,
  });
}

// docs/03-design.md §9.3 — Gallery → Description/Specification → Packaging → Application →
// Download PDF → Request Quotation CTA (FR-PROD-03 through FR-PROD-09).
export default async function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main>
      <JsonLd data={productJsonLd(product)} />
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        title={product.name}
        description={product.short_description}
      />

      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            {product.gallery.length > 0 ? (
              <GalleryGrid
                items={product.gallery.map((item) => ({ id: item.id, media: item.media }))}
              />
            ) : (
              <div className="relative aspect-4/3 overflow-hidden rounded-card">
                <SafeImage media={product.cover_image} />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-h2 text-neutral-900">Description</h2>
            <p className="mt-3 text-body-lg text-neutral-600">{product.full_description}</p>

            {product.specifications.length > 0 && (
              <div className="mt-8">
                <h3 className="text-h3 text-neutral-900">Specification</h3>
                <table className="mt-3 w-full text-body">
                  <tbody>
                    {product.specifications.map((spec) => (
                      <tr key={spec.id} className="border-b border-neutral-200">
                        <th scope="row" className="py-2 pr-4 text-left font-medium text-neutral-900">
                          {spec.spec_key}
                        </th>
                        <td className="py-2 text-neutral-600">{spec.spec_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {product.packaging.length > 0 && (
              <div className="mt-8">
                <h3 className="text-h3 text-neutral-900">Packaging</h3>
                {product.packaging.map((entry) => (
                  <p key={entry.id} className="mt-2 text-body text-neutral-600">
                    {entry.description}
                  </p>
                ))}
              </div>
            )}

            {product.applications.length > 0 && (
              <div className="mt-8">
                <h3 className="text-h3 text-neutral-900">Application</h3>
                {product.applications.map((entry) => (
                  <p key={entry.id} className="mt-2 text-body text-neutral-600">
                    {entry.description}
                  </p>
                ))}
              </div>
            )}

            {product.downloads.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {product.downloads.map((download) => (
                  <a
                    key={download.id}
                    href={download.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants("secondary", "md")}
                  >
                    Download {download.file_name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </Container>
      </Section>

      <Section tone="soft">
        <Container className="max-w-3xl">
          <h2 className="text-h2 text-neutral-900">Request a Quotation</h2>
          <p className="mt-2 text-body-lg text-neutral-600">
            Interested in {product.name}? Tell us your requirements below.
          </p>
          <Card className="mt-8">
            <QuotationForm
              sourcePage={`/products/${product.slug}`}
              productId={product.id}
              productName={product.name}
            />
          </Card>
        </Container>
      </Section>
    </main>
  );
}
