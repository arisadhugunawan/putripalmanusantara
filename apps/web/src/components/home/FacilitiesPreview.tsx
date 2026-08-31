"use client";

import type { DecorativeGraphic, Facility } from "@ppn/shared-types";
import { Container, Section, buttonVariants, cn } from "@ppn/ui-components";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { FacilityCard } from "@/components/facilities/FacilityCard";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SectionBackdrop } from "./SectionBackdrop";

/** FR-HOME-07 — facilities highlight carousel with a link to the full page. Horizontal Embla
 * carousel (same pattern as `ArticlesSection`) instead of a static grid capped at 3 cards, so
 * all of the master facility list is browsable here without needing its own detail routes. */
export function FacilitiesPreview({
  facilities,
  decorativeGraphics = [],
  dictionary,
}: {
  facilities: Facility[];
  decorativeGraphics?: DecorativeGraphic[];
  dictionary: Dictionary;
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

  if (facilities.length === 0) return null;

  return (
    <Section tone="soft" spacing="comfortable" className="relative overflow-hidden">
      <SectionBackdrop orbSide="left" />
      <DecorativeGraphics graphics={decorativeGraphics} />
      <Container className="relative">
        <FadeUpSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-500" />
              {dictionary.home.facilities.eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">{dictionary.home.facilities.heading}</h2>
            <p className="mt-2 max-w-lg text-body text-neutral-600">
              {dictionary.home.facilities.description}
            </p>
          </div>
          <Link href="/facilities" className={buttonVariants("ghost", "md")}>
            {dictionary.home.facilities.viewAllCta}
          </Link>
        </FadeUpSection>

        <div className="mt-10 md:mt-14">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-6 flex">
              {facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="min-w-0 shrink-0 grow-0 basis-[85%] pl-6 sm:basis-[55%] lg:basis-[32%]"
                >
                  <FacilityCard facility={facility} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2" role="tablist" aria-label={dictionary.home.facilities.ariaSlide}>
              {facilities.map((facility, index) => (
                <button
                  key={facility.id}
                  type="button"
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`${dictionary.home.facilities.ariaGoToFacility} ${index + 1}`}
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
                aria-label={dictionary.home.facilities.ariaPrevFacility}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowIcon className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                aria-label={dictionary.home.facilities.ariaNextFacility}
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
