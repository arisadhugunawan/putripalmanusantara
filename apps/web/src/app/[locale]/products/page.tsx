import { Container, Section } from "@ppn/ui-components";
import type { Locale } from "@ppn/shared-types";
import type { Metadata } from "next";
import { getPageHeader, getProducts } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { ProductCatalogueCard } from "@/components/products/catalogue/ProductCatalogueCard";
import { getDictionary } from "@/i18n/get-dictionary";
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
  const [products, dictionary, headerConfig] = await Promise.all([
    getProducts(locale),
    getDictionary(locale as Locale),
    getPageHeader("products", locale),
  ]);
  const t = dictionary.products;

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: dictionary.nav.home, href: "/" }, { label: t.breadcrumbProducts }]}
        title={t.pageTitle}
        description={t.pageDescription}
        locale={locale}
        headerConfig={headerConfig}
      />
      <Section>
        <Container>
          {products.length === 0 ? (
            <p className="text-body text-neutral-600">{t.noProductsYet}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCatalogueCard key={product.id} product={product} viewProductLabel={t.viewProduct} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
