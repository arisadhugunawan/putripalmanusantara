"use client";

import type { DecorativeGraphic, Facility } from "@ppn/shared-types";
import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { useRef } from "react";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { FacilityCard } from "@/components/facilities/FacilityCard";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SectionBackdrop } from "./SectionBackdrop";

/** FR-HOME-07 — facilities highlight, user-controlled horizontal scroll (same native
 * `overflow-x-auto` + `snap-x` pattern as `FeaturedProductsSection`, at every breakpoint rather
 * than only below `lg`) instead of an arrow/dot-driven Embla carousel. Roughly 3 cards sit in
 * view on desktop with the next one peeking at the edge — the peek itself is the "more to see"
 * affordance, so no separate scroll indicator is needed.
 *
 * The track is a single focusable region, but a focused generic `overflow-x-auto` div does NOT
 * reliably respond to arrow keys on its own (unlike a native `<select>`/`<textarea>`) — verified
 * by testing, not assumed. `onKeyDown` below scrolls it explicitly so keyboard users can still
 * reach every card without the removed Prev/Next buttons. */
export function FacilitiesPreview({
  facilities,
  decorativeGraphics = [],
  dictionary,
}: {
  facilities: Facility[];
  decorativeGraphics?: DecorativeGraphic[];
  dictionary: Dictionary;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (facilities.length === 0) return null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const track = trackRef.current;
    if (!track) return;
    event.preventDefault();
    const amount = track.clientWidth * 0.9;
    track.scrollBy({ left: event.key === "ArrowRight" ? amount : -amount, behavior: "smooth" });
  }

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

        <div
          ref={trackRef}
          role="region"
          aria-label={dictionary.home.facilities.heading}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="mt-10 flex gap-6 overflow-x-auto scroll-px-6 snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 md:mt-14 [&::-webkit-scrollbar]:hidden"
        >
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="min-w-0 shrink-0 grow-0 basis-[85%] snap-start sm:basis-[55%] lg:basis-[32%]"
            >
              <FacilityCard facility={facility} />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
