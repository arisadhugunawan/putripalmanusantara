import type { DecorativeGraphic, ProductSummary } from "@ppn/shared-types";
import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { ProductCard } from "@/components/products/ProductCard";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";
import { SectionBackdrop } from "./SectionBackdrop";

const LeafOutline = DECORATIVE_SVGS.leaf_outline;

/** FR-HOME-05 — featured products catalogue. Premium showcase treatment (Homepage UI/UX +
 * Featured Products passes): dot-grid + orb backdrop, one static leaf accent, scroll-reveal
 * header, staggered card reveal, hover zoom/lift/glow (see `ProductCard.tsx`).
 *
 * Below `lg`, cards are a CSS scroll-snap horizontal strip rather than a stacked single
 * column — brief: mobile browsing should feel like "more products available", not a shrunk
 * desktop grid. Pure CSS (`overflow-x-auto` + `snap-x`), no carousel library — this project's
 * existing convention (see `ProcessFlowchart`/marquees) is to reach for a dependency only when
 * autoplay/drag-physics are actually needed; a simple touch-scrollable strip needs neither. */
export function FeaturedProductsSection({
  products,
  decorativeGraphics = [],
  dictionary,
}: {
  products: ProductSummary[];
  decorativeGraphics?: DecorativeGraphic[];
  dictionary: Dictionary;
}) {
  if (products.length === 0) return null;

  return (
    <Section spacing="comfortable" className="relative overflow-hidden">
      <SectionBackdrop orbSide="right" />
      <DecorativeGraphics graphics={decorativeGraphics} />
      <LeafOutline
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-6 h-56 w-56 text-primary-700/[0.05] sm:h-72 sm:w-72"
      />
      <Container className="relative">
        <FadeUpSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
              {dictionary.home.products.eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">{dictionary.home.products.heading}</h2>
            <p className="mt-3 max-w-2xl text-body text-neutral-600">{dictionary.home.products.description}</p>
          </div>
          <Link href="/products" className={buttonVariants("ghost", "md")}>
            {dictionary.home.products.viewAllCta}
          </Link>
        </FadeUpSection>

        <div
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product, index) => (
            <FadeUpSection
              key={product.id}
              className="w-[78%] shrink-0 snap-center sm:w-[45%] lg:w-auto"
              style={{ transitionDelay: `${Math.min(index * 100, 300)}ms` }}
            >
              <ProductCard product={product} dictionary={dictionary} />
            </FadeUpSection>
          ))}
        </div>
      </Container>
    </Section>
  );
}
