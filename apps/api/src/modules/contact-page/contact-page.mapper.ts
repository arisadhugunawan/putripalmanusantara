import type {
  ContactLocation as SharedContactLocation,
  ContactPageSettings as SharedContactPageSettings,
  ContactSocialLink as SharedContactSocialLink,
  Media as SharedMedia,
} from '@ppn/shared-types';
import type {
  ContactLocationModel as ContactLocation,
  ContactSocialLinkModel as ContactSocialLink,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

/** The camelCase (Prisma) name for each of `toContactPageSettings()`'s translatable fields,
 * paired with the snake_case (API) field it resolves — needed because, unlike every other
 * translated model, Contact's public read path resolves locale against the already-mapped
 * snapshot JSON (see `resolveContactPageSettingsLocale()` below), not the live Prisma row. */
const TRANSLATABLE_SETTINGS_FIELDS = [
  ['hero_eyebrow', 'heroEyebrow'],
  ['hero_heading', 'heroHeading'],
  ['hero_description', 'heroDescription'],
  ['whatsapp_message_greeting', 'whatsappMessageGreeting'],
  ['whatsapp_message_intro', 'whatsappMessageIntro'],
  ['whatsapp_message_product_list_label', 'whatsappMessageProductListLabel'],
  ['whatsapp_message_closing', 'whatsappMessageClosing'],
] as const;

type ContactPageSettingsWithRelations = {
  id: string;
  email: string;
  whatsappNumber: string;
  businessHoursOpenDays: string[];
  businessHoursOpenTime: string;
  businessHoursCloseTime: string;
  businessHoursUtcOffset: number;
  heroEyebrow: string;
  heroHeading: string;
  heroDescription: string;
  heroImage: Media | null;
  heroOverlayOpacity: number;
  heroCtaPrimaryText: string;
  heroCtaSecondaryText: string;
  buyerCtaHeading: string;
  buyerCtaDescription: string;
  buyerCtaButtonText: string;
  supplierCtaHeading: string;
  supplierCtaDescription: string;
  supplierCtaButtonText: string;
  supplierCtaWhatsappMessage: string;
  whatsappMessageGreeting: string;
  whatsappMessageIntro: string;
  whatsappMessageProductListLabel: string;
  whatsappMessageClosing: string;
  mainMapLocationId: string | null;
  updatedAt: Date;
  translations?: unknown;
};

function toMedia(media: Media): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType,
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    uploaded_at: media.uploadedAt.toISOString(),
  };
}

export function toContactPageSettings(
  entry: ContactPageSettingsWithRelations,
): SharedContactPageSettings {
  return {
    id: entry.id,
    email: entry.email,
    whatsapp_number: entry.whatsappNumber,
    business_hours_open_days: entry.businessHoursOpenDays,
    business_hours_open_time: entry.businessHoursOpenTime,
    business_hours_close_time: entry.businessHoursCloseTime,
    business_hours_utc_offset: entry.businessHoursUtcOffset,
    hero_eyebrow: entry.heroEyebrow,
    hero_heading: entry.heroHeading,
    hero_description: entry.heroDescription,
    hero_image: entry.heroImage ? toMedia(entry.heroImage) : null,
    hero_overlay_opacity: entry.heroOverlayOpacity,
    hero_cta_primary_text: entry.heroCtaPrimaryText,
    hero_cta_secondary_text: entry.heroCtaSecondaryText,
    buyer_cta_heading: entry.buyerCtaHeading,
    buyer_cta_description: entry.buyerCtaDescription,
    buyer_cta_button_text: entry.buyerCtaButtonText,
    supplier_cta_heading: entry.supplierCtaHeading,
    supplier_cta_description: entry.supplierCtaDescription,
    supplier_cta_button_text: entry.supplierCtaButtonText,
    supplier_cta_whatsapp_message: entry.supplierCtaWhatsappMessage,
    whatsapp_message_greeting: entry.whatsappMessageGreeting,
    whatsapp_message_intro: entry.whatsappMessageIntro,
    whatsapp_message_product_list_label: entry.whatsappMessageProductListLabel,
    whatsapp_message_closing: entry.whatsappMessageClosing,
    main_map_location_id: entry.mainMapLocationId,
    updated_at: entry.updatedAt.toISOString(),
    translations:
      entry.translations as SharedContactPageSettings['translations'],
  };
}

/**
 * Resolves `translations` for the requested locale against an already-mapped (snake_case)
 * `ContactPageSettings` object — the counterpart to every other mapper's `translate()` call,
 * adapted for Contact's draft/publish split. Every other translated model resolves locale at
 * *read* time straight off the live Prisma row (see Footer/PageHeader); Contact's public read
 * instead comes from `ContactPagePublishedSnapshot.data`, a frozen JSON blob with no live row
 * to re-query. `publish()` embeds the settings row's full `translations` object into that
 * snapshot as-is (see `contact-page.service.ts`), so this function re-resolves it from the
 * snapshot at request time — same `translate()` primitive as everywhere else, just called
 * against a small camelCase-keyed adapter object built from the snake_case fields instead of
 * a live Prisma row, since the snapshot only has the snake_case shape to work with.
 */
export function resolveContactPageSettingsLocale(
  settings: SharedContactPageSettings,
  locale: string,
): SharedContactPageSettings {
  const camelBase = Object.fromEntries(
    TRANSLATABLE_SETTINGS_FIELDS.map(([snakeField, camelKey]) => [
      camelKey,
      settings[snakeField],
    ]),
  );
  const resolved = translate(
    camelBase,
    settings.translations,
    locale,
    TRANSLATABLE_SETTINGS_FIELDS.map(([, camelKey]) => camelKey),
  );
  const result = { ...settings };
  for (const [snakeField, camelKey] of TRANSLATABLE_SETTINGS_FIELDS) {
    result[snakeField] = resolved[camelKey];
  }
  return result;
}

export function toContactLocation(
  entry: ContactLocation,
): SharedContactLocation {
  return {
    id: entry.id,
    name: entry.name,
    location_type: entry.locationType,
    label: entry.label,
    address: entry.address,
    google_maps_url: entry.googleMapsUrl,
    phone: entry.phone,
    email: entry.email,
    order: entry.order,
    active: entry.active,
    updated_at: entry.updatedAt.toISOString(),
  };
}

export function toContactSocialLink(
  entry: ContactSocialLink,
): SharedContactSocialLink {
  return {
    id: entry.id,
    platform: entry.platform,
    display_name: entry.displayName,
    url: entry.url,
    active: entry.active,
    open_in_new_tab: entry.openInNewTab,
    order: entry.order,
    updated_at: entry.updatedAt.toISOString(),
  };
}
