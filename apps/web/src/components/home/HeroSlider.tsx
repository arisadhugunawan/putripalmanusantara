"use client";

import type { DecorativeGraphic, HeroSlide, HeroTextAlignment } from "@ppn/shared-types";
import { Container, buttonVariants, cn } from "@ppn/ui-components";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";

const AUTOPLAY_DELAY_MS = 6000;

const ALIGNMENT_CLASSES: Record<HeroTextAlignment, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

/**
 * Full-screen hero carousel — CMS-driven (Admin > Homepage > Hero Slides), Embla-powered
 * (autoplay, infinite loop, swipe, pause-on-hover/tab-hidden), with a Ken Burns background
 * zoom per slide. Falls back to a single static slide (no carousel chrome) when there's
 * only one, and to a CMS-independent branded section when there are zero — the Hero must
 * never render blank.
 */
export function HeroSlider({
  slides,
  decorativeGraphics,
}: {
  slides: HeroSlide[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (slides.length === 0) return <HeroFallback />;
  if (slides.length === 1) return <StaticSlide slide={slides[0]} decorativeGraphics={decorativeGraphics} />;
  return <Carousel slides={slides} decorativeGraphics={decorativeGraphics} />;
}

/** No CMS slide is enabled yet — a plain on-brand section so the Homepage never opens on a
 * blank Hero. Carries no image/CTA dependency on the database at all. */
function HeroFallback() {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-linear-to-b from-primary-700 to-neutral-900 text-center sm:min-h-[70vh]">
      <Container className="relative z-10 py-24">
        <h1 className="mx-auto max-w-2xl text-h1 text-white">CV Putri Palma Nusantara</h1>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-primary-50">
          Indonesian Coconut Product Exporter
        </p>
      </Container>
    </section>
  );
}

function StaticSlide({ slide, decorativeGraphics }: { slide: HeroSlide; decorativeGraphics: DecorativeGraphic[] }) {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-neutral-900 sm:min-h-[85vh] lg:min-h-screen">
      <SlideBackground slide={slide} active priority />
      <DecorativeGraphics graphics={decorativeGraphics} tone="light" className="z-[5]" />
      <SlideContent slide={slide} />
    </section>
  );
}

function Carousel({ slides, decorativeGraphics }: { slides: HeroSlide[]; decorativeGraphics: DecorativeGraphic[] }) {
  // Embla only reads plugins/options on mount, so a fresh array/object literal each render
  // is the documented usage — no useRef needed to "stabilize" it.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 }, [
    Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  // Starts in sync with Embla's own initial selected index (0) — the "select"/"reInit"
  // listeners below keep it in sync from then on, so no synchronous setState-on-mount call
  // is needed here.
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Pause autoplay while the browser tab isn't visible — no point animating/burning cycles
  // on a hidden tab, and it avoids the slider "jumping" several slides when the visitor
  // comes back.
  useEffect(() => {
    if (!emblaApi) return;
    const autoplay = emblaApi.plugins().autoplay;
    if (!autoplay) return;
    function onVisibilityChange() {
      if (document.hidden) autoplay?.stop();
      else autoplay?.play();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [emblaApi]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") emblaApi?.scrollPrev();
    if (event.key === "ArrowRight") emblaApi?.scrollNext();
  }

  return (
    <section
      className="relative min-h-[70vh] overflow-hidden bg-neutral-900 sm:min-h-[85vh] lg:min-h-screen"
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <DecorativeGraphics graphics={decorativeGraphics} tone="light" className="z-[5]" />
      <div ref={emblaRef} className="h-full min-h-[70vh] overflow-hidden sm:min-h-[85vh] lg:min-h-screen">
        <div className="flex h-full min-h-[70vh] sm:min-h-[85vh] lg:min-h-screen">
          {slides.map((slide, index) => (
            <div key={slide.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
              <div className="relative flex min-h-[70vh] items-end overflow-hidden sm:min-h-[85vh] lg:min-h-screen">
                <SlideBackground slide={slide} active={index === selectedIndex} priority={index === 0} />
                <SlideContent slide={slide} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:flex"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:flex"
      >
        <ArrowIcon direction="right" />
      </button>

      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === selectedIndex ? "true" : undefined}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full bg-white/50 transition-all duration-300",
              index === selectedIndex ? "w-7 bg-white" : "w-2 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function SlideBackground({ slide, active, priority }: { slide: HeroSlide; active: boolean; priority: boolean }) {
  return (
    <>
      <div key={active ? `${slide.id}-active` : `${slide.id}-idle`} className={cn("absolute inset-0", active && "animate-ken-burns")}>
        <div className="hidden h-full w-full sm:block">
          <SafeImage media={slide.desktop_image} priority={priority} sizes="100vw" />
        </div>
        <div className="block h-full w-full sm:hidden">
          <SafeImage media={slide.mobile_image ?? slide.desktop_image} priority={priority} sizes="100vw" />
        </div>
      </div>
      <div className="absolute inset-0 bg-neutral-900" style={{ opacity: slide.overlay_opacity / 100 }} aria-hidden="true" />
      <div className="absolute inset-0 bg-linear-to-t from-neutral-900/70 via-neutral-900/10 to-transparent" aria-hidden="true" />
    </>
  );
}

function SlideContent({ slide }: { slide: HeroSlide }) {
  const showButton1 = slide.button_1_enabled && slide.button_1_text && slide.button_1_link;
  const showButton2 = slide.button_2_enabled && slide.button_2_text && slide.button_2_link;

  return (
    <Container className="relative z-10 pb-20 pt-40 sm:pb-28">
      <div className={cn("mx-auto flex max-w-3xl flex-col", ALIGNMENT_CLASSES[slide.text_alignment])}>
        {slide.eyebrow_text && (
          <p className="animate-fade-in-up text-small font-medium uppercase tracking-wide text-primary-300">
            {slide.eyebrow_text}
          </p>
        )}
        <h1 className="animate-fade-in-up mt-3 max-w-3xl text-hero text-white">{slide.heading}</h1>
        <p className="animate-fade-in-up mt-6 max-w-xl text-body-lg text-neutral-100/90 [animation-delay:100ms]">
          {slide.subheading}
        </p>
        {slide.description && (
          <p className="animate-fade-in-up mt-3 max-w-xl text-body text-neutral-100/75 [animation-delay:140ms]">
            {slide.description}
          </p>
        )}
        {(showButton1 || showButton2) && (
          <div className="animate-fade-in-up mt-8 flex flex-wrap gap-4 [animation-delay:180ms]">
            {showButton1 && (
              <Link href={slide.button_1_link!} className={buttonVariants(slide.button_1_style, "lg")}>
                {slide.button_1_text}
              </Link>
            )}
            {showButton2 && (
              <Link
                href={slide.button_2_link!}
                className={cn(
                  buttonVariants(slide.button_2_style, "lg"),
                  slide.button_2_style === "secondary" && "border-white/40 text-white hover:border-white",
                )}
              >
                {slide.button_2_text}
              </Link>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
