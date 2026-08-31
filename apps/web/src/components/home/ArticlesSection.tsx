"use client";

import type { ArticleSummary, DecorativeGraphic, Locale } from "@ppn/shared-types";
import { Container, Section, buttonVariants, cn } from "@ppn/ui-components";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SectionBackdrop } from "./SectionBackdrop";

/**
 * FR-HOME-09 / FR-ART-01 — homepage "Insight & Articles" teaser. Horizontal editorial
 * carousel (Homepage UI/UX pass, brief item 17) rather than a static 3-column grid: user-
 * driven Embla scroll (drag/swipe, no autoplay — these cards are meant to be read and
 * clicked, not passively watched like the logo marquees), arrow controls, and a progress
 * dot per article. Reuses `ArticleCard` unchanged — same card the Article Detail page's
 * Related Insights section uses, so "featured/premium editorial" styling never drifts
 * between the two surfaces.
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Embla's own "select"/"reInit" events only fire on user interaction — this initial call
    // is what sets the correct prev/next-disabled state before the reader ever touches it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (articles.length === 0) return null;

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

        <div className="mt-10 md:mt-14">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-6 flex">
              {articles.map((article) => (
                <div key={article.id} className="min-w-0 shrink-0 grow-0 basis-[85%] pl-6 sm:basis-[55%] lg:basis-[32%]">
                  <ArticleCard article={article} dictionary={dictionary} locale={locale} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2" role="tablist" aria-label={dictionary.home.articles.ariaSlide}>
              {articles.map((article, index) => (
                <button
                  key={article.id}
                  type="button"
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`${dictionary.home.articles.ariaGoToArticle} ${index + 1}`}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === selectedIndex ? "w-8 bg-primary-600" : "w-1.5 bg-neutral-300 hover:bg-neutral-400",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                aria-label={dictionary.home.articles.ariaPrevArticle}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowIcon className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                aria-label={dictionary.home.articles.ariaNextArticle}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4.5 w-4.5", className)}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
