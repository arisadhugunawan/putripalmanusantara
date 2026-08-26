import {
  DEFAULT_LOCALE,
  type FooterSettings as SharedFooterSettings,
  type Media as SharedMedia,
} from '@ppn/shared-types';
import type {
  FooterSettingsModel as FooterSettings,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export type FooterSettingsWithRelations = FooterSettings & {
  backgroundImage: Media | null;
  mobileBackgroundImage: Media | null;
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

export function toFooterSettings(
  entry: FooterSettingsWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedFooterSettings {
  const t = translate(entry, entry.translations, locale, [
    'tagline',
    'description',
    'ctaHeadline',
    'ctaDescription',
    'ctaPrimaryText',
    'ctaSecondaryText',
  ]);
  return {
    id: entry.id,
    enabled: entry.enabled,
    show_cta: entry.showCta,
    show_social: entry.showSocial,
    show_contact: entry.showContact,
    show_navigation: entry.showNavigation,
    company_name: entry.companyName,
    tagline: t.tagline,
    description: t.description,
    background_image: entry.backgroundImage
      ? toMedia(entry.backgroundImage)
      : null,
    mobile_background_image: entry.mobileBackgroundImage
      ? toMedia(entry.mobileBackgroundImage)
      : null,
    background_alt_text: entry.backgroundAltText,
    overlay_type: entry.overlayType,
    overlay_opacity: entry.overlayOpacity,
    background_position: entry.backgroundPosition,
    mobile_background_position: entry.mobileBackgroundPosition,
    cta_headline: t.ctaHeadline,
    cta_description: t.ctaDescription,
    cta_primary_text: t.ctaPrimaryText,
    cta_secondary_text: t.ctaSecondaryText,
    updated_at: entry.updatedAt.toISOString(),
    translations: entry.translations as SharedFooterSettings['translations'],
  };
}
