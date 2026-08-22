import type { Media } from "./media";
import type { PageHeaderPosition } from "./page-header";

export const FOOTER_OVERLAY_TYPES = ["dark_green", "charcoal", "black", "green_gradient"] as const;
export type FooterOverlayType = (typeof FOOTER_OVERLAY_TYPES)[number];

/** Admin view of the Footer's singleton settings — everything genuinely footer-specific.
 * Contact info, business hours, social links, and office locations are NOT duplicated here;
 * they're read straight from `PublishedContactPagePayload` (see `getPublicContactPage()`). */
export interface FooterSettings {
  id: string;
  enabled: boolean;
  show_cta: boolean;
  show_social: boolean;
  show_contact: boolean;
  show_navigation: boolean;
  company_name: string;
  tagline: string;
  description: string;
  background_image: Media | null;
  mobile_background_image: Media | null;
  background_alt_text: string | null;
  overlay_type: FooterOverlayType;
  overlay_opacity: number;
  background_position: PageHeaderPosition;
  mobile_background_position: PageHeaderPosition;
  cta_headline: string;
  cta_description: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  updated_at: string;
}

/** Public read shape — identical fields to the admin view (there's nothing sensitive on this
 * singleton to hide), kept as a separate type only for parity with the rest of this codebase's
 * admin-vs-public type convention. */
export type PublicFooterSettings = FooterSettings;
