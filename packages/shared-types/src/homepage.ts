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
export type HeroButtonStyle = "primary" | "secondary";
export type HeroTextAlignment = "left" | "center" | "right";

export interface HeroSlide {
  id: string;
  desktop_image: Media | null;
  mobile_image: Media | null;
  eyebrow_text: string | null;
  heading: string;
  subheading: string;
  description: string | null;
  button_1_text: string | null;
  button_1_link: string | null;
  button_1_enabled: boolean;
  button_1_style: HeroButtonStyle;
  button_2_text: string | null;
  button_2_link: string | null;
  button_2_enabled: boolean;
  button_2_style: HeroButtonStyle;
  text_alignment: HeroTextAlignment;
  /** 0-100 (%) — darkness of the scrim between the background image and the text. */
  overlay_opacity: number;
  order: number;
  enabled: boolean;
  publish_date: string | null;
  /** Admin-only — present so the CMS can populate LocaleTabs. */
  translations?: Translations | null;
}

/** Free-text, not a fixed union — the admin can add categories beyond this suggested list
 * (a Prisma enum can't be extended without a migration, so the column is a plain string). */
export type PartnerLogoCategory = string;

export const PARTNER_LOGO_SUGGESTED_CATEGORIES = [
  "Government Institution",
  "Export & Trade",
  "Agriculture",
  "Certification",
  "Financial Institution",
  "Logistics",
  "Business Association",
  "Strategic Partner",
  "Other",
] as const;

/** Trusted-partners marquee logo (Post-Launch). Zero logos is valid — no real
 * partnership/institution names or logo files are fabricated ahead of client confirmation. */
export interface PartnerLogo {
  id: string;
  logo: Media;
  partner_name: string;
  description: string | null;
  website_url: string | null;
  open_in_new_tab: boolean;
  /** Falls back to partner_name when empty — see PartnerMarquee.tsx. */
  alt_text: string | null;
  category: PartnerLogoCategory;
  order: number;
  enabled: boolean;
  featured: boolean;
  translations?: Translations | null;
}

/** Homepage "Trusted Institutions & Partners" section content (Post-Launch) — a singleton,
 * like HomepageAboutPreview. */
export interface HomepagePartnersSection {
  id: string;
  title: string;
  subtitle: string;
  marquee_duration_seconds: number;
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
  | "coconut_tree_silhouette"
  | "container_outline";

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

export type HomepageVideoSource = "none" | "youtube" | "vimeo" | "upload";

/** Homepage "About Company Preview" section content (Post-Launch) — a singleton, not a
 * list. `video_source: "none"` (the seeded default) is a valid, honest state: no company
 * video exists yet, so the section shows a placeholder until the admin adds one. */
export interface HomepageAboutPreview {
  id: string;
  label: string;
  heading: string;
  paragraph_1: string;
  paragraph_2: string;
  paragraph_3: string;
  cta_text: string;
  cta_link: string;
  video_source: HomepageVideoSource;
  video_url: string | null;
  video_media: Media | null;
  video_thumbnail: Media | null;
  enabled: boolean;
  translations?: Translations | null;
}

export type HomepageHighlightIcon = "quality" | "sustainability" | "partnership" | "service" | "globe" | "award";

/** One of the About Preview section's highlight cards (Post-Launch). */
export interface HomepageHighlight {
  id: string;
  icon: HomepageHighlightIcon;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
  translations?: Translations | null;
}

export type HomepageWhyChooseUsIcon =
  | "quality"
  | "supply"
  | "export_ready"
  | "consistency"
  | "sustainability"
  | "service"
  | "pricing"
  | "delivery";

/** One "Why Choose Us?" card (Post-Launch) — icon + short title only, no description by
 * design. `enabled`/`featured` are independent gates, same pattern as PartnerLogo. */
export interface HomepageWhyChooseUs {
  id: string;
  icon: HomepageWhyChooseUsIcon;
  title: string;
  order: number;
  enabled: boolean;
  featured: boolean;
  translations?: Translations | null;
}
