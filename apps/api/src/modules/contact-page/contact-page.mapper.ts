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
  };
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
