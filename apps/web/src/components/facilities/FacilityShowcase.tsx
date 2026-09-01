"use client";

import type {
  AboutCompanyFacilitiesSection,
  Facility,
  FacilityGalleryImageItem,
} from "@ppn/shared-types";
import { buttonVariants, cn } from "@ppn/ui-components";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { Link } from "@/i18n/Link";
import { SafeImage } from "@/components/SafeImage";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { FacilityIcon } from "./FacilityIcons";

type FacilitiesDictionary = Dictionary["facilities"];

/** How long after the visitor last interacted before auto-rotation resumes. */
const RESUME_DELAY_MS = 4000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** A facility with no gallery photos still shows its cover image in the panel — same
 * "image if set, otherwise nothing" leniency as every other CMS gallery in this codebase. */
function buildGalleryImages(facility: Facility): FacilityGalleryImageItem[] {
  if (facility.gallery.length > 0) return facility.gallery;
  if (!facility.cover_image) return [];
  return [
    {
      id: `${facility.id}-cover`,
      media: facility.cover_image,
      title: null,
      caption: null,
      category: null,
      alt_text: null,
      order: 0,
      featured: true,
      active: true,
    },
  ];
}

/**
 * "Our Facilities" — a horizontal scroll-snap carousel through the fixed 10-facility master
 * list (icon + number + name, active item highlighted) sitting above a large image panel that
 * crossfades on switch; each facility's photos openable fullscreen via the shared
 * `GalleryLightbox`. One layout serves both desktop and mobile — the carousel track is native
 * horizontal scroll (`scroll-snap-type: x mandatory`), so desktop gets arrow buttons over the
 * same track a touch visitor swipes directly, rather than two parallel nav implementations.
 *
 * Optional auto-rotation (admin-configurable via `section.auto_rotate`/
 * `rotate_interval_seconds`, 5-8s) advances to the next facility, pausing immediately on any
 * pointer/touch/keyboard interaction and resuming after `RESUME_DELAY_MS` idle — same
 * pause/resume shape already proven in `FactoryGalleryCarousel.tsx`. Disabled entirely under
 * `prefers-reduced-motion`, along with the crossfade and card tilt-hover.
 */
export function FacilityShowcase({
  facilities,
  section,
  dictionary,
  carouselAriaLabel,
  locationLabel,
}: {
  facilities: Facility[];
  section: AboutCompanyFacilitiesSection;
  dictionary: FacilitiesDictionary;
  /** Accessible name for the facility-picker tablist — reuses the page's own "Facilities"
   * nav label rather than duplicating it as a new dictionary key. */
  carouselAriaLabel: string;
  /** Reuses `dictionary.contact.locationLabel` ("Location") — same generic concept, no need
   * for a second "Location" key scoped to this page. */
  locationLabel: string;
}) {
  const [activeId, setActiveId] = useState(facilities[0]?.id ?? null);
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFacility = facilities.find((f) => f.id === activeId) ?? facilities[0] ?? null;
  const galleryImages = activeFacility ? buildGalleryImages(activeFacility) : [];
  const activeImage = galleryImages[imageIndex] ?? null;

  // Jumping to a different facility always starts from its first photo — adjusted during render
  // (React's documented "resetting state when a prop changes" pattern) rather than in an effect.
  const [prevActiveId, setPrevActiveId] = useState(activeId);
  if (activeId !== prevActiveId) {
    setPrevActiveId(activeId);
    setImageIndex(0);
  }

  const pauseAutoRotate = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const intervalMs = clamp(section.rotate_interval_seconds, 5, 8) * 1000;

  useEffect(() => {
    if (!section.auto_rotate || reducedMotion || paused || facilities.length < 2) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setActiveId((current) => {
        const index = facilities.findIndex((f) => f.id === current);
        return facilities[(index + 1) % facilities.length]?.id ?? current;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [section.auto_rotate, reducedMotion, paused, facilities, intervalMs]);

  function selectFacility(id: string) {
    setActiveId(id);
    pauseAutoRotate();
  }

  function goToImage(delta: number) {
    setImageIndex((current) => {
      const next = current + delta;
      if (next < 0 || next >= galleryImages.length) return current;
      return next;
    });
    pauseAutoRotate();
  }

  if (!activeFacility) return null;

  return (
    <div
      onPointerDown={pauseAutoRotate}
      onTouchStart={pauseAutoRotate}
      onFocus={pauseAutoRotate}
    >
      <FadeUpSection>
        <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
          <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
          {section.eyebrow}
        </p>
        <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">{section.heading}</h2>
        {section.description && (
          <p className="mt-4 max-w-2xl text-body-lg text-neutral-600">{section.description}</p>
        )}
        <p className="mt-3 text-small text-neutral-400">{dictionary.introDescription}</p>
      </FadeUpSection>

      <FadeUpSection className="mt-10" style={{ transitionDelay: "80ms" }}>
        <FacilityCarouselNav
          facilities={facilities}
          activeId={activeFacility.id}
          onSelect={selectFacility}
          dictionary={dictionary}
          ariaLabel={carouselAriaLabel}
        />
      </FadeUpSection>

      <FadeUpSection className="mt-6" style={{ transitionDelay: "150ms" }}>
        <FacilityImagePanel
          facility={activeFacility}
          image={activeImage}
          index={imageIndex}
          total={galleryImages.length}
          transitionKey={`${activeFacility.id}-${imageIndex}`}
          reducedMotion={reducedMotion}
          onPrev={() => goToImage(-1)}
          onNext={() => goToImage(1)}
          onOpen={() => setLightboxOpen(true)}
          dictionary={dictionary}
          locationLabel={locationLabel}
        />
      </FadeUpSection>

      <FadeUpSection className="mt-8" style={{ transitionDelay: "200ms" }}>
        <Link href="/about" className={cn("inline-flex items-center gap-2", buttonVariants("ghost", "md"))}>
          {dictionary.exploreOperationsCta}
          <span aria-hidden="true">→</span>
        </Link>
      </FadeUpSection>

      {lightboxOpen && galleryImages.length > 0 && (
        <GalleryLightbox
          images={galleryImages}
          startIndex={imageIndex}
          onClose={() => setLightboxOpen(false)}
          fallbackAlt={activeFacility.name}
          labels={{
            zoomOut: dictionary.lightboxZoomOutLabel,
            zoomIn: dictionary.lightboxZoomInLabel,
            fitToScreen: dictionary.lightboxFitToScreenLabel,
            fitShort: dictionary.lightboxFitShortLabel,
            exitFullscreen: dictionary.lightboxExitFullscreenLabel,
            fullscreen: dictionary.lightboxFullscreenLabel,
            close: dictionary.lightboxCloseLabel,
            previous: dictionary.lightboxPreviousLabel,
            next: dictionary.lightboxNextLabel,
            prevShort: dictionary.lightboxPrevShort,
            nextShort: dictionary.lightboxNextShort,
            ariaTemplate: dictionary.lightboxAriaTemplate,
          }}
        />
      )}
    </div>
  );
}

function FacilityCarouselNav({
  facilities,
  activeId,
  onSelect,
  dictionary,
  ariaLabel,
}: {
  facilities: Facility[];
  activeId: string;
  onSelect: (id: string) => void;
  dictionary: FacilitiesDictionary;
  ariaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  const activeIndex = facilities.findIndex((f) => f.id === activeId);
  const dragState = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Keep the active card in view — covers both auto-rotation and clicks on an off-screen card.
  useEffect(() => {
    cardRefs.current[activeIndex]?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, reducedMotion]);

  function scrollByCard(direction: -1 | 1) {
    const cardWidth = cardRefs.current[0]?.getBoundingClientRect().width ?? 220;
    trackRef.current?.scrollBy({ left: direction * (cardWidth + 12), behavior: reducedMotion ? "auto" : "smooth" });
  }

  function handleTiltMove(index: number, event: React.MouseEvent<HTMLButtonElement>) {
    if (reducedMotion) return;
    const card = cardRefs.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-4px) scale(1.02) rotateX(${(-py * 2).toFixed(2)}deg) rotateY(${(px * 2).toFixed(2)}deg)`;
  }
  function handleTiltLeave(index: number) {
    const card = cardRefs.current[index];
    if (card) card.style.transform = "";
  }

  // Click-and-drag scrolling on desktop — the track is already natively touch-swipeable and
  // wheel-scrollable, this just extends the same gesture to mouse drag. `moved` past a small
  // threshold suppresses the resulting click so a drag never also selects whatever card the
  // pointer happened to release over.
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !trackRef.current) return;
    dragState.current = { startX: event.clientX, startScrollLeft: trackRef.current.scrollLeft, moved: false };
    setDragging(true);
  }
  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    if (!state || !trackRef.current) return;
    const delta = event.clientX - state.startX;
    if (Math.abs(delta) > 4) state.moved = true;
    trackRef.current.scrollLeft = state.startScrollLeft - delta;
  }
  function endDrag() {
    dragState.current = null;
    setDragging(false);
  }
  function handleCardClickCapture(event: React.MouseEvent<HTMLButtonElement>) {
    if (dragState.current?.moved) event.preventDefault();
  }

  // Roving keyboard navigation (WAI-ARIA "Tabs" pattern) — Left/Right moves focus + selection
  // between facilities, Home/End jump to the first/last, Escape blurs back out of the carousel.
  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = Math.min(index + 1, facilities.length - 1);
    else if (event.key === "ArrowLeft") nextIndex = Math.max(index - 1, 0);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = facilities.length - 1;
    else if (event.key === "Escape") (event.currentTarget as HTMLElement).blur();

    if (nextIndex === null) return;
    event.preventDefault();
    onSelect(facilities[nextIndex].id);
    cardRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="relative min-w-0 [contain:inline-size]">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label={dictionary.scrollLeftAriaLabel}
        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-700 lg:flex"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label={dictionary.scrollRightAriaLabel}
        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-700 lg:flex"
      >
        →
      </button>

      <div
        ref={trackRef}
        role="tablist"
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "flex snap-x snap-proximity gap-3 overflow-x-auto px-1 py-2 [-webkit-overflow-scrolling:touch] [overscroll-behavior-inline:contain] [perspective:800px] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden",
          dragging ? "cursor-grabbing scroll-auto" : "cursor-grab scroll-smooth",
        )}
      >
        {facilities.map((facility, index) => {
          const isActive = facility.id === activeId;
          return (
            <button
              key={facility.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(facility.id)}
              onClickCapture={handleCardClickCapture}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              onMouseMove={(event) => handleTiltMove(index, event)}
              onMouseLeave={() => handleTiltLeave(index)}
              className={cn(
                "flex min-h-[160px] w-[78vw] shrink-0 snap-start flex-col items-start gap-2 rounded-2xl border px-4 py-3.5 text-left transition-[background-color,border-color,color,box-shadow] duration-500 ease-out sm:w-[220px] lg:w-[190px] xl:w-[220px]",
                isActive
                  ? "border-primary-500 bg-primary-50 text-primary-800 shadow-[0_0_0_4px_rgba(122,184,71,0.12)]"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
              )}
            >
              <FacilityIcon slug={facility.slug} className={cn("h-6 w-6", isActive ? "text-primary-700" : "text-neutral-400")} />
              <span>
                <span className={cn("block text-small font-semibold uppercase tracking-wide", isActive ? "text-primary-700" : "text-neutral-400")}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={cn("block text-small font-medium leading-snug", isActive ? "text-neutral-900" : "text-neutral-600")}>
                  {facility.name}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 lg:hidden" aria-hidden="true">
        {facilities.map((facility) => (
          <span
            key={facility.id}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-300",
              facility.id === activeId ? "w-4 bg-primary-500" : "w-1.5 bg-neutral-300",
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-center text-small text-neutral-400 lg:hidden">
        {activeIndex + 1} / {facilities.length}
      </p>
    </div>
  );
}

function FacilityImagePanel({
  facility,
  image,
  index,
  total,
  transitionKey,
  reducedMotion,
  onPrev,
  onNext,
  onOpen,
  dictionary,
  locationLabel,
}: {
  facility: Facility;
  image: FacilityGalleryImageItem | null;
  index: number;
  total: number;
  transitionKey: string;
  reducedMotion: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
  dictionary: FacilitiesDictionary;
  locationLabel: string;
}) {
  // Reset per transition (adjusted during render — React's documented pattern for state that
  // must reset when a prop changes — rather than in an effect). Under reduced motion the
  // fade/scale is skipped entirely by ORing `reducedMotion` into the className below, so this
  // effect never needs to set state synchronously for that branch.
  const [entered, setEntered] = useState(false);
  const [prevTransitionKey, setPrevTransitionKey] = useState(transitionKey);
  if (transitionKey !== prevTransitionKey) {
    setPrevTransitionKey(transitionKey);
    setEntered(false);
  }

  useEffect(() => {
    if (reducedMotion) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [transitionKey, reducedMotion]);

  const hasMetadata = facility.facility_type || facility.location || facility.status;

  return (
    <div>
      <button
        type="button"
        onClick={onOpen}
        disabled={!image}
        aria-label={dictionary.openPhotoFullscreenAriaTemplate.replace("{name}", facility.name)}
        className="group relative block aspect-16/10 w-full overflow-hidden rounded-3xl bg-neutral-100 disabled:cursor-default lg:aspect-21/9"
      >
        {image ? (
          <Image
            key={transitionKey}
            src={image.media.file_url}
            alt={image.alt_text || image.title || facility.name}
            fill
            sizes="(min-width: 1024px) 1100px, 100vw"
            className={cn(
              "object-cover transition-[opacity,transform] duration-600 ease-out group-hover:scale-[1.04]",
              entered || reducedMotion ? "scale-100 opacity-100" : "scale-[1.02] opacity-0",
            )}
          />
        ) : (
          <SafeImage
            media={facility.cover_image}
            sizes="(min-width: 1024px) 1100px, 100vw"
            emptyLabel={dictionary.imageComingSoonAriaLabel}
          />
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="pointer-events-none absolute inset-x-6 bottom-5 flex translate-y-1.5 items-center gap-2 text-body font-semibold text-white opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          {dictionary.viewPhotosCta}
          <span className="transition-transform duration-300 ease-out group-hover:translate-x-1.5">→</span>
        </span>
        {total > 1 && (
          <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-small font-medium tabular-nums text-white backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        )}
      </button>

      {total > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0}
            aria-label={dictionary.previousPhotoAriaLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index === total - 1}
            aria-label={dictionary.nextPhotoAriaLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}

      <div className="mt-5">
        <span className="text-small font-semibold uppercase tracking-wide text-primary-700">
          {String(facility.order).padStart(2, "0")}
        </span>
        <h3 className="mt-1 text-h3 text-neutral-900">{facility.name}</h3>
        <p className="mt-2 text-body text-neutral-600">{facility.description}</p>
        {hasMetadata && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-small text-neutral-500">
            {facility.facility_type && (
              <span>
                <span className="font-semibold text-neutral-700">{dictionary.facilityTypeLabel}</span>{" "}
                {facility.facility_type}
              </span>
            )}
            {facility.location && (
              <span>
                <span className="font-semibold text-neutral-700">{locationLabel}</span> {facility.location}
              </span>
            )}
            {facility.status && (
              <span>
                <span className="font-semibold text-neutral-700">{dictionary.facilityStatusLabel}</span>{" "}
                {facility.status}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
