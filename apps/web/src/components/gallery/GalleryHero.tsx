"use client";

import { DEFAULT_LOCALE, isLocale, type ResolvedPageHeader } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/page/Breadcrumb";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";
import { HEIGHT_CLASSES, OBJECT_POSITION_CLASS, OVERLAY_COLOR } from "@/components/page/PageHeaderPreview";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Cinematic hero for the Gallery landing page — distinct from the standard `PageHeader` used
 * by every other listing page (brief calls for a dedicated title-reveal moment here), but still
 * emits the same breadcrumb + BreadcrumbList JSON-LD every other page does for SEO parity.
 * On-mount (not scroll-triggered — the hero is always the first thing in view) blur→sharp +
 * fade-up title, delayed subtitle fade, and a slow image scale-in. `prefers-reduced-motion`
 * shows everything immediately at its resting state, no motion at all.
 *
 * `headerConfig` (Admin → Settings → Inner Page Header → Gallery) is optional and additive: when
 * it resolves a background image, this renders that photo + overlay behind the existing content
 * instead of the plain gradient, switches text to the configured colors, and hides the
 * light-background-tuned decorative silhouettes (invisible against a photo anyway) — the reveal
 * animation and breadcrumb are unchanged either way. Omit (or a config with no image) renders
 * byte-identical to before this prop existed.
 */
export function GalleryHero({
  locale,
  totalPhotoCount,
  headerConfig,
  dictionary,
}: {
  locale?: string;
  totalPhotoCount: number;
  headerConfig?: ResolvedPageHeader | null;
  dictionary: Dictionary;
}) {
  const resolvedLocale = locale && isLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = dictionary.gallery;
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const revealed = reducedMotion || mounted;
  const WorldMapOutline = DECORATIVE_SVGS.world_map_outline;
  const CoconutTree = DECORATIVE_SVGS.coconut_tree_silhouette;

  const backgroundImage = headerConfig?.background_image ?? null;
  const mobileBackgroundImage = headerConfig?.mobile_background_image ?? backgroundImage;
  const showBreadcrumb = headerConfig ? headerConfig.show_breadcrumb : true;
  const resolvedTitle = headerConfig?.custom_title?.trim() || t.heroFallbackTitle;
  const resolvedDescription =
    headerConfig?.subtitle?.trim() ||
    `${t.heroFallbackDescription}${totalPhotoCount > 0 ? ` ${t.heroMomentsCapturedTemplate.replace("{count}", String(totalPhotoCount))}` : ""}`;

  const overlayOpacity = backgroundImage && headerConfig?.overlay_enabled ? headerConfig.overlay_opacity / 100 : 0;
  const altText = headerConfig?.alt_text?.trim() || resolvedTitle;

  return (
    <div
      className={
        backgroundImage
          ? `relative overflow-hidden border-b border-neutral-200 bg-neutral-900 ${HEIGHT_CLASSES[headerConfig!.height_preset]}`
          : "relative overflow-hidden border-b border-neutral-200 bg-linear-to-b from-neutral-50 to-white"
      }
    >
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: dictionary.nav.home, path: "/" },
            { name: dictionary.nav.gallery, path: "/gallery" },
          ],
          resolvedLocale,
        )}
      />

      {backgroundImage ? (
        <>
          <div
            className="absolute inset-0"
            style={{ animation: "page-header-zoom 8s ease-out forwards" }}
          >
            <Image
              src={backgroundImage.file_url}
              alt={altText}
              fill
              priority
              sizes="100vw"
              className={`hidden object-cover sm:block ${OBJECT_POSITION_CLASS[headerConfig!.background_position]}`}
            />
            <Image
              src={mobileBackgroundImage?.file_url ?? backgroundImage.file_url}
              alt={altText}
              fill
              priority
              sizes="100vw"
              className={`block object-cover sm:hidden ${OBJECT_POSITION_CLASS[headerConfig!.mobile_background_position]}`}
            />
          </div>
          {headerConfig!.overlay_enabled &&
            (headerConfig!.overlay_type === "gradient" ? (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, rgba(10,10,10,${overlayOpacity}) 0%, rgba(10,10,10,${overlayOpacity * 0.4}) 55%, rgba(10,10,10,${overlayOpacity}) 100%)`,
                }}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: OVERLAY_COLOR[headerConfig!.overlay_type], opacity: overlayOpacity }}
              />
            ))}
        </>
      ) : (
        <>
          <WorldMapOutline className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] text-primary-900/5" />
          <CoconutTree className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 text-primary-900/[0.04]" />
        </>
      )}

      <Container className="relative py-14 lg:py-20">
        {showBreadcrumb && (
          <Breadcrumb
            items={[{ label: dictionary.nav.home, href: "/" }, { label: dictionary.nav.gallery }]}
            color={backgroundImage ? headerConfig!.breadcrumb_color : undefined}
          />
        )}

        <div className="mt-8 max-w-2xl">
          <p
            className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700 transition-[opacity,transform] duration-700 ease-out"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(12px)",
              color: backgroundImage ? headerConfig!.subtitle_color : undefined,
            }}
          >
            <span
              aria-hidden="true"
              className="h-px w-8 bg-primary-400"
              style={{ backgroundColor: backgroundImage ? headerConfig!.subtitle_color : undefined }}
            />
            {t.heroEyebrow}
          </p>
          <h1
            className="mt-3 text-h1 text-neutral-900 transition-[opacity,transform,filter] duration-700 ease-out"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(20px)",
              filter: revealed ? "blur(0px)" : "blur(10px)",
              color: backgroundImage ? headerConfig!.title_color : undefined,
            }}
          >
            {resolvedTitle}
          </h1>
          <p
            className="mt-4 max-w-xl text-body-lg text-neutral-600 transition-[opacity,transform] duration-700 ease-out"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(16px)",
              transitionDelay: revealed ? "150ms" : "0ms",
              color: backgroundImage ? headerConfig!.subtitle_color : undefined,
            }}
          >
            {resolvedDescription}
          </p>
        </div>
      </Container>
    </div>
  );
}
