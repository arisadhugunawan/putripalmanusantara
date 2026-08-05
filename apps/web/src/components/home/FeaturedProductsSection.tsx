import { Container, Section, buttonVariants } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";

/** FR-HOME-05 — featured products grid. */
export function FeaturedProductsSection({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-h2 text-neutral-900">Featured Products</h2>
          <Link href="/products" className={buttonVariants("ghost", "md")}>
            View All Products →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
