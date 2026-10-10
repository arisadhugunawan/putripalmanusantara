"use client";

import type { ArticleSummary, DecorativeGraphic, Locale } from "@ppn/shared-types";
import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { useRef } from "react";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SectionBackdrop } from "./SectionBackdrop";

/**
 * FR-HOME-09 / FR-ART-01 — homepage "Insight & Articles" teaser, user-controlled horizontal
 * scroll (same native `overflow-x-auto` + `snap-x` pattern as `FeaturedProductsSection`/
 * `FacilitiesPreview`, at every breakpoint) instead of an arrow/dot-driven Embla carousel.
 * Roughly 3 cards sit in view on desktop with the next one peeking at the edge — the peek
 * itself is the "more to see" affordance, so no separate scroll indicator is needed. Reuses
 * `ArticleCard` unchanged — same card the Article Detail page's Related Insights section uses,
 * so "featured/premium editorial" styling never drifts between the two surfaces.
 *
 * The track is a single focusable region, but a focused generic `overflow-x-auto` div does NOT
 * reliably respond to arrow keys on its own (confirmed while building the identical Facilities
 * scroll track) — `onKeyDown` scrolls it explicitly so keyboard users can still reach every
 * card without the removed Prev/Next buttons.
 */
export function ArticlesSection({
  articles,
  decorativeGraphics = [],
  dictionary,
  locale,
}: {
  articles: ArticleSummary[];
  decorativeGraphics?: DecorativeGraphic[];
  dictionary: Dictionary;
  locale: Locale;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (articles.length === 0) return null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const track = trackRef.current;
    if (!track) return;
    event.preventDefault();
    const amount = track.clientWidth * 0.9;
    track.scrollBy({ left: event.key === "ArrowRight" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <Section spacing="comfortable" className="relative overflow-hidden">
      <SectionBackdrop orbSide="left" />
      <DecorativeGraphics graphics={decorativeGraphics} />
      <Container className="relative">
        <FadeUpSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
              {dictionary.home.articles.eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">
              {dictionary.home.articles.heading}
            </h2>
          </div>
          <Link href="/articles" className={buttonVariants("ghost", "md")}>
            {dictionary.home.articles.viewAllCta}
          </Link>
        </FadeUpSection>

        <div
          ref={trackRef}
          role="region"
          aria-label={dictionary.home.articles.heading}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="mt-10 flex gap-6 overflow-x-auto scroll-px-6 snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 md:mt-14 [&::-webkit-scrollbar]:hidden"
        >
          {articles.map((article) => (
            <div
              key={article.id}
              className="min-w-0 shrink-0 grow-0 basis-[85%] snap-start sm:basis-[55%] lg:basis-[32%]"
            >
              <ArticleCard article={article} dictionary={dictionary} locale={locale} />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
