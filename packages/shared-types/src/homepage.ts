import type { Media } from "./media";
import type { Translations } from "./i18n";

export interface HomepageStatistic {
  id: string;
  label: string;
  value: string;
  icon: string | null;
  order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  status: "draft" | "published";
}

/** Homepage hero carousel slide (Post-Launch). Zero slides is valid — the public site
 * falls back to a single static slide. */
export interface HeroSlide {
  id: string;
  desktop_image: Media | null;
  mobile_image: Media | null;
  heading: string;
  subheading: string;
  button_1_text: string | null;
  button_1_link: string | null;
  button_2_text: string | null;
  button_2_link: string | null;
  order: number;
  enabled: boolean;
  publish_date: string | null;
  /** Admin-only — present so the CMS can populate LocaleTabs. */
  translations?: Translations | null;
}

export type PartnerLogoCategory =
  | "government"
  | "certification"
  | "logistics"
  | "association"
  | "bank"
  | "other";

/** Trusted-partners marquee logo (Post-Launch). Zero logos is valid — no real
 * partnership/institution names are fabricated ahead of client confirmation. */
export interface PartnerLogo {
  id: string;
  logo: Media;
  partner_name: string;
  website_url: string | null;
  category: PartnerLogoCategory;
  order: number;
  enabled: boolean;
  translations?: Translations | null;
}

export type DecorativeGraphicVariant =
  | "leaf_outline"
  | "coconut_cross_section"
  | "ship_outline"
  | "compass"
  | "world_map_outline"
  | "palm_leaf"
  | "coconut_tree_silhouette";

export type DecorativeGraphicPlacement =
  | "hero_behind_content"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"
  | "center_background";

/** Low-opacity built-in line-art watermark (Post-Launch) — no photo upload, a `variant`
 * key selects one of a small set of hand-authored SVGs rendered by the frontend. */
export interface DecorativeGraphic {
  id: string;
  page: string;
  variant: DecorativeGraphicVariant;
  placement: DecorativeGraphicPlacement;
  opacity: number;
  scale: number;
  order: number;
  enabled: boolean;
}
