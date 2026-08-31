import type { ProductSummary } from "@ppn/shared-types";
import { Card, buttonVariants, cn } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";

/**
 * Premium catalogue card for the /products listing page. Deliberately a separate
 * component from components/products/ProductCard.tsx — that one is also used by the
 * Home page's Featured Products section, which is explicitly out of scope for this
 * redesign, so it's left untouched.
 */
export function ProductCatalogueCard({
  product,
  viewProductLabel = "View Product",
  imageEmptyLabel = "Image coming soon",
}: {
  product: ProductSummary;
  viewProductLabel?: string;
  imageEmptyLabel?: string;
}) {
  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <Card
        hoverable
        className="flex h-full flex-col overflow-hidden p-0 shadow-card transition-transform duration-300 hover:-translate-y-1.5"
      >
        <div className="relative aspect-4/3 overflow-hidden">
          {/* `relative` here, not just on the ancestor above — next/image's `fill` requires
              its DIRECT parent to be positioned, otherwise Next.js logs an "invalid position"
              warning on every load. */}
          <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105">
            <SafeImage
              media={product.cover_image}
              sizes="(min-width: 1024px) 25vw, 50vw"
              emptyLabel={imageEmptyLabel}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-small font-medium uppercase tracking-wide text-primary-700">
            {product.category}
          </p>
          {/* h2, not h3: this card sits directly under the listing page's own <h1>
              (PageHeader), with no intermediate <h2> section heading on this page. */}
          <h2 className="mt-1.5 text-h3 text-neutral-900">{product.name}</h2>
          <p className="mt-2 flex-1 text-body text-neutral-600">{product.short_description}</p>
          <span className={cn("mt-5 w-fit", buttonVariants("secondary", "sm"))}>{viewProductLabel}</span>
        </div>
      </Card>
    </Link>
  );
}
