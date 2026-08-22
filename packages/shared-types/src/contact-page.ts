import type { Media } from "./media";

export type ContactLocationType = "head_office" | "operational" | "business";

/** Admin (draft) view of a single office/operational location. */
export interface ContactLocation {
  id: string;
  name: string;
  location_type: ContactLocationType;
  label: string;
  address: string;
  google_maps_url: string;
  phone: string | null;
  email: string | null;
  order: number;
  active: boolean;
  updated_at: string;
}

/** Admin (draft) view of the Contact page's singleton settings — hero, contact info,
 * business hours, social links, and which location is the main map. */
export interface ContactPageSettings {
  id: string;
  email: string;
  whatsapp_number: string;
  business_hours_open_days: string[];
  business_hours_open_time: string;
  business_hours_close_time: string;
  business_hours_utc_offset: number;
  hero_eyebrow: string;
  hero_heading: string;
  hero_description: string;
  hero_image: Media | null;
  hero_overlay_opacity: number;
  hero_cta_primary_text: string;
  hero_cta_secondary_text: string;
  buyer_cta_heading: string;
  buyer_cta_description: string;
  buyer_cta_button_text: string;
  supplier_cta_heading: string;
  supplier_cta_description: string;
  supplier_cta_button_text: string;
  supplier_cta_whatsapp_message: string;
  /** Main WhatsApp click-to-chat message, built from these four parts plus the live product
   * catalog (see `buildWhatsAppMessage()` in `apps/web/src/lib/whatsapp.ts`) — replaces what
   * used to be hardcoded i18n dictionary strings. */
  whatsapp_message_greeting: string;
  whatsapp_message_intro: string;
  whatsapp_message_product_list_label: string;
  whatsapp_message_closing: string;
  main_map_location_id: string | null;
  updated_at: string;
}

/** Admin (draft) view of a single "Connect With PPN" social platform row — open-ended list,
 * replaces the old four fixed instagram/tiktok/facebook/linkedin fields on
 * `ContactPageSettings`. */
export interface ContactSocialLink {
  id: string;
  platform: string;
  display_name: string;
  url: string;
  active: boolean;
  open_in_new_tab: boolean;
  order: number;
  updated_at: string;
}

export interface ContactPagePublishStatus {
  is_published: boolean;
  last_published_at: string | null;
  has_unpublished_changes: boolean;
}

/** The public Contact page's single data source — returned by `GET /contact-page`. `null`
 * when nothing has ever been published, or after an explicit Unpublish (see README "Contact
 * Page — Full Redesign"); the page renders nothing rather than leaking draft content. */
export interface PublishedContactPagePayload {
  settings: ContactPageSettings;
  locations: ContactLocation[];
  social_links: ContactSocialLink[];
  main_map_location: ContactLocation | null;
}
