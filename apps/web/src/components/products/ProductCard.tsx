import type { ProductSummary } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";

/** Featured Products redesign (Homepage UI/UX pass) — image-dominant editorial card. Hover
 * treatment is hand-rolled here rather than the shared `Card hoverable` prop (translateY-1 +
 * shadow-card-hover) so this specific card can reach the brief's larger -8px lift and
 * `--shadow-premium` glow without changing `Card`'s default for every other consumer
 * (Facilities highlights, etc.). */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={`View details for ${product.name}`}
      className="group block h-full rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      <div
        className="flex h-full flex-col overflow-hidden rounded-card border border-neutral-200/80 bg-white transition-[transform,box-shadow,border-color] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:border-primary-100 group-hover:shadow-premium"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
          <SafeImage
            media={product.cover_image}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 85vw"
            className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-neutral-900/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-small font-medium uppercase tracking-[0.08em] text-primary-700">
            {product.category}
          </p>
          <h3 className="mt-1.5 text-[clamp(1.375rem,1.05rem+1.4vw,2.125rem)] font-bold leading-tight text-neutral-900">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-body text-neutral-600">{product.short_description}</p>
          <div className="mt-5 flex items-center gap-2 text-body font-medium text-neutral-900">
            <span className="relative">
              View Details
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-primary-600 transition-transform duration-200 ease-out group-hover:translate-x-1.5"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
