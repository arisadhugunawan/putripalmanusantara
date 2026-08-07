import type { ProductSummary } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";

/** Section 10 "Related Products" — the other products in the catalogue, excluding the
 * current one. */
export function RelatedProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.slug}`} className="block h-full">
          <Card hoverable className="flex h-full flex-col overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1">
            <div className="relative aspect-4/3">
              <SafeImage media={product.cover_image} sizes="(min-width: 1024px) 33vw, 100vw" />
            </div>
            <div className="p-5">
              <p className="text-small font-medium uppercase tracking-wide text-primary-700">{product.category}</p>
              <h3 className="mt-1 text-body-lg font-medium text-neutral-900">{product.name}</h3>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
