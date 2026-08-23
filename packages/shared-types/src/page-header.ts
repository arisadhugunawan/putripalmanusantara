import type { Media } from "./media";

/** Reserved `page_key` that supplies the fallback for any field a page-specific row leaves
 * unset — see Admin → Settings → Inner Page Header → "Global Default Header". */
export const GLOBAL_DEFAULT_PAGE_HEADER_KEY = "global-default";

/** Every real page this system manages, in the order shown in the Admin's Page Header list and
 * in the public site's own nav. Contact deliberately keeps its own existing CMS-driven hero
 * (see README "Inner Page Header") and isn't part of this list; a News/Article Detail page
 * renders each article's own real cover image instead of a page-level background. Gallery IS
 * included — `GalleryHero.tsx` layers this system's background/overlay/colors behind its own
 * existing decorative reveal animation rather than replacing it outright. */
export const PAGE_HEADER_KEYS = [
  "about-company",
  "products",
  "product-detail",
  "facilities",
  "gallery",
  "news",
] as const;
export type PageHeaderKey = (typeof PAGE_HEADER_KEYS)[number];

export const PAGE_HEADER_OVERLAY_TYPES = ["dark", "light", "green", "gradient"] as const;
export type PageHeaderOverlayType = (typeof PAGE_HEADER_OVERLAY_TYPES)[number];

export const PAGE_HEADER_POSITIONS = [
  "center",
  "center_top",
  "center_bottom",
  "left",
  "right",
] as const;
export type PageHeaderPosition = (typeof PAGE_HEADER_POSITIONS)[number];

export const PAGE_HEADER_HEIGHT_PRESETS = ["compact", "standard", "tall"] as const;
export type PageHeaderHeightPreset = (typeof PAGE_HEADER_HEIGHT_PRESETS)[number];

/** Admin view of one row — every design field nullable (`null` = "inherit from Global
 * Default"), matching the DB's 3-tier merge (page-specific → global-default → system
 * constant). */
export interface PageHeader {
  id: string;
  page_key: string;
  is_active: boolean;
  background_image: Media | null;
  mobile_background_image: Media | null;
  alt_text: string | null;
  custom_title: string | null;
  subtitle: string | null;
  overlay_enabled: boolean | null;
  overlay_type: PageHeaderOverlayType | null;
  overlay_opacity: number | null;
  background_position: PageHeaderPosition | null;
  mobile_background_position: PageHeaderPosition | null;
  height_preset: PageHeaderHeightPreset | null;
  title_color: string | null;
  subtitle_color: string | null;
  breadcrumb_color: string | null;
  show_breadcrumb: boolean | null;
  updated_at: string;
  /** i18n — non-English overrides for `custom_title`/`subtitle`, keyed by locale then field
   * name. Never meaningful on the reserved "global-default" row, matching `custom_title`. */
  translations?: Record<string, Record<string, string>> | null;
}

/** Final fallback tier once neither the page-specific row nor Global Default set a field —
 * mirrored by the backend's `resolvePageHeader()` (`apps/api/src/modules/page-headers/
 * page-header.mapper.ts`) and reused as-is by the Admin editor's client-side Live Preview so
 * the two can never compute a different resolved value for the same inputs. */
export const PAGE_HEADER_SYSTEM_DEFAULTS = {
  overlay_enabled: true,
  overlay_type: "green" as PageHeaderOverlayType,
  overlay_opacity: 35,
  background_position: "center" as PageHeaderPosition,
  mobile_background_position: "center" as PageHeaderPosition,
  height_preset: "standard" as PageHeaderHeightPreset,
  title_color: "#FFFFFF",
  subtitle_color: "#FFFFFF",
  breadcrumb_color: "#FFFFFF",
  show_breadcrumb: true,
};

/** Public read shape — every field already fully resolved through the 3-tier chain, so the
 * frontend never has to know about Global Default or system constants, only render this. */
export interface ResolvedPageHeader {
  background_image: Media | null;
  mobile_background_image: Media | null;
  alt_text: string | null;
  custom_title: string | null;
  subtitle: string | null;
  overlay_enabled: boolean;
  overlay_type: PageHeaderOverlayType;
  overlay_opacity: number;
  background_position: PageHeaderPosition;
  mobile_background_position: PageHeaderPosition;
  height_preset: PageHeaderHeightPreset;
  title_color: string;
  subtitle_color: string;
  breadcrumb_color: string;
  show_breadcrumb: boolean;
}
