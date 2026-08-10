import type { Media } from "./media";
import type { Translations } from "./i18n";
import type { ExportDestination, HomepageExportReach } from "./export-destination";

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

/** Not every logo shown is necessarily a confirmed formal partnership — Admin records the
 * true relationship per record; the public section title stays "Global Shipping Partner"
 * regardless (see README — same "don't imply an unconfirmed relationship" rule as
 * PartnerLogo's category). */
export type ShippingRelationshipType =
  | "shipping_partner"
  | "shipping_line"
  | "carrier"
  | "logistics_partner"
  | "freight_network"
  | "service_provider"
  | "other";

export const SHIPPING_RELATIONSHIP_TYPES: ShippingRelationshipType[] = [
  "shipping_partner",
  "shipping_line",
  "carrier",
  "logistics_partner",
  "freight_network",
  "service_provider",
  "other",
];

export const SHIPPING_RELATIONSHIP_TYPE_LABELS: Record<ShippingRelationshipType, string> = {
  shipping_partner: "Shipping Partner",
  shipping_line: "Shipping Line",
  carrier: "Carrier",
  logistics_partner: "Logistics Partner",
  freight_network: "Freight Network",
  service_provider: "Service Provider",
  other: "Other",
};

/** "Global Shipping Partner" carousel logo (Post-Launch). Zero rows is valid — no shipping
 * line/carrier logos or relationships are fabricated ahead of client confirmation, same rule
 * as PartnerLogo. */
export interface ShippingPartner {
  id: string;
  logo: Media;
  partner_name: string;
  relationship_type: ShippingRelationshipType;
  description: string | null;
  website_url: string | null;
  open_in_new_tab: boolean;
  /** Falls back to partner_name when empty. */
  alt_text: string | null;
  order: number;
  enabled: boolean;
  featured: boolean;
  updated_at: string;
  translations?: Translations | null;
}

/** Homepage "Global Shipping Partner" section content (Post-Launch) — a singleton, same
 * get-or-create pattern as HomepagePartnersSection. */
export interface HomepageShippingSection {
  id: string;
  title: string;
  subtitle: string;
  marquee_duration_seconds: number;
  show_partner_name: boolean;
  show_relationship_type: boolean;
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

// ── Homepage Manager: Draft/Publish (Post-Launch) ──────────────────────────
// See README "Homepage Manager" — every section above keeps working exactly as it does today
// (Admin's draft working copy); these types add a Draft/Published separation on top of it.

/** Stable order matches the actual section order rendered in `[locale]/page.tsx`. Sections
 * marked "content lives elsewhere" have no Homepage-owned content — their Manage action links
 * to the module that already owns it (Facility/Article/GalleryItem/ProductionStep admin); only
 * their position/visibility on the Homepage is controlled here. */
export const HOMEPAGE_SECTION_KEYS = [
  "hero_slider",
  "partners",
  "about_company",
  "statistics",
  "why_choose_us",
  "featured_products",
  "production_process",
  "facilities",
  "gallery",
  "news_articles",
  "export_reach",
  "shipping_partner",
  "faq",
  "contact_cta",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export interface HomepageSectionConfig {
  id: string;
  key: HomepageSectionKey;
  order: number;
  visible: boolean;
  updated_at: string;
}

export interface HomepagePublishStatus {
  last_published_at: string | null;
  has_unpublished_changes: boolean;
}

/** Lightweight history entry for rollback — the full `data` payload is never sent to the list
 * view, only fetched when actually restoring. */
export interface HomepageSnapshotSummary {
  id: string;
  published_at: string;
}

/** The public Homepage's single data source for its CMS-owned sections (everything except
 * Featured Products/Facilities/Gallery/Production Process/News, which stay live-fetched — see
 * README "Homepage Manager"). Returned by `GET /homepage/published-snapshot`. */
export interface PublishedHomepagePayload {
  hero_slides: HeroSlide[];
  partners_section: HomepagePartnersSection;
  partner_logos: PartnerLogo[];
  about_preview: HomepageAboutPreview;
  highlights: HomepageHighlight[];
  why_choose_us: HomepageWhyChooseUs[];
  export_reach_section: HomepageExportReach;
  export_destinations: ExportDestination[];
  shipping_section: HomepageShippingSection;
  shipping_partners: ShippingPartner[];
  statistics: HomepageStatistic[];
  faqs: Faq[];
  section_config: HomepageSectionConfig[];
}
