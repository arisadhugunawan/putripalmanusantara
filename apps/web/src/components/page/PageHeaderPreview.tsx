import type { PageHeaderHeightPreset, PageHeaderPosition, ResolvedPageHeader } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Image from "next/image";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

/** Exported for `GalleryHero.tsx`, which layers this same background/overlay treatment behind
 * its own bespoke reveal animation instead of delegating to `PageHeaderPreview` outright — see
 * that file's comment for why. */
export const OBJECT_POSITION_CLASS: Record<PageHeaderPosition, string> = {
  center: "object-center",
  center_top: "object-top",
  center_bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

export const OVERLAY_COLOR: Record<string, string> = {
  dark: "#0A0A0A",
  light: "#FFFFFF",
  green: "#183D2B",
};

export const HEIGHT_CLASSES: Record<PageHeaderHeightPreset, string> = {
  compact: "min-h-[260px] sm:min-h-[320px] lg:min-h-[400px]",
  standard: "min-h-[300px] sm:min-h-[360px] lg:min-h-[450px]",
  tall: "min-h-[340px] sm:min-h-[400px] lg:min-h-[500px]",
};

/**
 * Shared render logic for every "Inner Page Header" banner — used both by the real public
 * `PageHeader.tsx` and by the Admin editor's Live Preview panel, so the two can never visually
 * drift apart (brief: "Preview harus terlihat seperti hasil actual frontend"). When `config` is
 * `null`, or resolves with no background image anywhere in the page-specific → global-default →
 * system-constant chain, this renders the plain flat banner exactly as it looked before this
 * system existed — zero visual change for a page nobody has configured yet.
 */
export function PageHeaderPreview({
  breadcrumb,
  title,
  titleAccent,
  description,
  config,
  animateBackground = true,
  priority = true,
}: {
  breadcrumb: BreadcrumbItem[];
  title: string;
  titleAccent?: string | null;
  description?: string;
  config: ResolvedPageHeader | null;
  /** Live Preview pauses the slow zoom (a static image is easier to compare against form
   * changes) — the real public page always animates. */
  animateBackground?: boolean;
  /** Off for the Admin Live Preview thumbnail, which isn't the actual LCP element of a real
   * page load. */
  priority?: boolean;
}) {
  const resolvedTitle = config?.custom_title?.trim() || title;
  const accent = titleAccent && resolvedTitle.startsWith(titleAccent) ? titleAccent : null;
  const rest = accent ? resolvedTitle.slice(accent.length) : resolvedTitle;
  const resolvedDescription = config?.subtitle?.trim() || description;

  const showBreadcrumb = config ? config.show_breadcrumb : true;

  if (!config || !config.background_image) {
    return (
      <div className="relative overflow-hidden border-b border-neutral-200 bg-neutral-100">
        <Container className="relative py-12 lg:py-16">
          {showBreadcrumb && <Breadcrumb items={breadcrumb} />}
          <h1 className="mt-3 text-h1 text-neutral-900">
            {accent ? (
              <>
                <span className="text-accent-500">{accent}</span>
                {rest}
              </>
            ) : (
              resolvedTitle
            )}
          </h1>
          {resolvedDescription && (
            <p className="mt-3 max-w-2xl text-body-lg text-neutral-600">{resolvedDescription}</p>
          )}
        </Container>
      </div>
    );
  }

  const backgroundImage = config.background_image;
  const mobileBackgroundImage = config.mobile_background_image ?? backgroundImage;
  const overlayOpacity = config.overlay_enabled ? config.overlay_opacity / 100 : 0;
  const altText = config.alt_text?.trim() || resolvedTitle;

  return (
    <div
      className={`relative flex flex-col justify-center overflow-hidden border-b border-neutral-200 bg-neutral-900 ${HEIGHT_CLASSES[config.height_preset]}`}
    >
      <div
        className="absolute inset-0"
        style={{ animation: animateBackground ? "page-header-zoom 8s ease-out forwards" : undefined }}
      >
        <Image
          src={backgroundImage.file_url}
          alt={altText}
          fill
          priority={priority}
          sizes="100vw"
          className={`hidden object-cover sm:block ${OBJECT_POSITION_CLASS[config.background_position]}`}
        />
        <Image
          src={mobileBackgroundImage?.file_url ?? backgroundImage.file_url}
          alt={altText}
          fill
          priority={priority}
          sizes="100vw"
          className={`block object-cover sm:hidden ${OBJECT_POSITION_CLASS[config.mobile_background_position]}`}
        />
      </div>
      {config.overlay_enabled &&
        (config.overlay_type === "gradient" ? (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(10,10,10,${overlayOpacity}) 0%, rgba(10,10,10,${overlayOpacity * 0.4}) 55%, rgba(10,10,10,${overlayOpacity}) 100%)`,
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: OVERLAY_COLOR[config.overlay_type], opacity: overlayOpacity }}
          />
        ))}

      <Container className="relative py-10 lg:py-14">
        {showBreadcrumb && <Breadcrumb items={breadcrumb} color={config.breadcrumb_color} />}
        <h1 className="mt-3 text-h1" style={{ color: config.title_color }}>
          {accent ? (
            <>
              <span style={{ color: config.title_color, opacity: 0.85 }}>{accent}</span>
              {rest}
            </>
          ) : (
            resolvedTitle
          )}
        </h1>
        {resolvedDescription && (
          <p className="mt-3 max-w-2xl text-body-lg" style={{ color: config.subtitle_color }}>
            {resolvedDescription}
          </p>
        )}
      </Container>
    </div>
  );
}
