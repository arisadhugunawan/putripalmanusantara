"use client";

import { Container } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";

/** "Products" is a virtual gallery category (brief §29) — real cards straight from the Products
 * module (`getProducts`), never duplicated into GalleryItem rows. Clicking a card goes to the
 * real product detail page, not a lightbox. */
export function GalleryProductCategoryPanel({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <Container className="py-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block overflow-hidden rounded-[20px] bg-neutral-100 shadow-[0_16px_40px_-20px_rgba(24,61,43,0.3)]"
          >
            <div className="relative aspect-4/5 w-full">
              <SafeImage media={product.cover_image} sizes="(min-width: 1024px) 24vw, 46vw" />
              <div className="absolute inset-0 bg-neutral-900/0 opacity-0 transition-[opacity,background-color] duration-300 ease-out group-hover:bg-neutral-900/40 group-hover:opacity-100" />
              <span className="absolute inset-x-3 bottom-3 translate-y-1.5 text-small font-semibold text-white opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                {product.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
