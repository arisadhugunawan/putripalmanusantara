import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getProducts } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { ProductCatalogueCard } from "@/components/products/catalogue/ProductCatalogueCard";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Products",
    description:
      "Browse Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — export-ready coconut products from CV Putri Palma Nusantara.",
    path: "/products",
    locale,
  });
}

// FR-PROD-01 — grid of all published products (4 categories).
export default async function ProductsPage({ params }: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  const products = await getProducts(locale);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Products" }]}
        title="Our Products"
        description="Export-ready coconut products, sorted and quality-checked before shipment."
        locale={locale}
      />
      <Section>
        <Container>
          {products.length === 0 ? (
            <p className="text-body text-neutral-600">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCatalogueCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
