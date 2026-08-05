import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getProducts } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { ProductCard } from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Products | CV Putri Palma Nusantara",
  description:
    "Browse Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — export-ready coconut products from CV Putri Palma Nusantara.",
};

// FR-PROD-01 — grid of all published products (4 categories).
export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Products" }]}
        title="Our Products"
        description="Export-ready coconut products, sorted and quality-checked before shipment."
      />
      <Section>
        <Container>
          {products.length === 0 ? (
            <p className="text-body text-neutral-600">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
