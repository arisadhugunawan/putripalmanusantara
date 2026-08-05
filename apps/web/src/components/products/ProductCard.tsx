import { Card } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <Card hoverable className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-4/3">
          <SafeImage media={product.cover_image} sizes="(min-width: 1024px) 25vw, 50vw" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-small font-medium uppercase tracking-wide text-primary-700">
            {product.category}
          </p>
          <h3 className="mt-1 text-h3 text-neutral-900">{product.name}</h3>
          <p className="mt-2 flex-1 text-body text-neutral-600">{product.short_description}</p>
          <span className="mt-4 text-body font-medium text-neutral-900 underline underline-offset-4 decoration-primary-500">
            View Details →
          </span>
        </div>
      </Card>
    </Link>
  );
}
