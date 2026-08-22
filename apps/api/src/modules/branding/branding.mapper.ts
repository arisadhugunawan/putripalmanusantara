import type {
  Media as SharedMedia,
  PublicSiteBranding,
  SiteBranding as SharedSiteBranding,
} from '@ppn/shared-types';
import type {
  MediaModel as Media,
  SiteBrandingModel as SiteBranding,
} from '../../../generated/prisma/models';

const DEFAULT_ALT_TEXT = 'CV. Putri Palma Nusantara';

export type SiteBrandingWithRelations = SiteBranding & {
  headerLogo: Media | null;
  footerLogo: Media | null;
  mobileLogo: Media | null;
  favicon: Media | null;
  productHeaderBackground: Media | null;
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

export function toSiteBranding(
  entry: SiteBrandingWithRelations,
): SharedSiteBranding {
  return {
    id: entry.id,
    header_logo: entry.headerLogo ? toMedia(entry.headerLogo) : null,
    header_logo_enabled: entry.headerLogoEnabled,
    header_logo_alt: entry.headerLogoAlt || DEFAULT_ALT_TEXT,
    footer_logo: entry.footerLogo ? toMedia(entry.footerLogo) : null,
    footer_logo_enabled: entry.footerLogoEnabled,
    footer_logo_alt: entry.footerLogoAlt || DEFAULT_ALT_TEXT,
    mobile_logo: entry.mobileLogo ? toMedia(entry.mobileLogo) : null,
    use_mobile_logo: entry.useMobileLogo,
    mobile_logo_alt: entry.mobileLogoAlt || DEFAULT_ALT_TEXT,
    favicon: entry.favicon ? toMedia(entry.favicon) : null,
    product_header_background: entry.productHeaderBackground
      ? toMedia(entry.productHeaderBackground)
      : null,
    updated_at: entry.updatedAt.toISOString(),
  };
}

/** Public read path — resolves the mobile-logo fallback (Logic: IF mobileLogo exists AND
 * enabled, use it; ELSE use headerLogo) and hides disabled slots entirely so the site only
 * ever has to decide "render this logo or fall back to the text wordmark". */
export function toPublicSiteBranding(
  entry: SiteBrandingWithRelations,
): PublicSiteBranding {
  const headerLogo =
    entry.headerLogoEnabled && entry.headerLogo
      ? toMedia(entry.headerLogo)
      : null;
  const mobileLogo =
    entry.useMobileLogo && entry.mobileLogo
      ? toMedia(entry.mobileLogo)
      : headerLogo;
  return {
    header_logo: headerLogo,
    header_logo_alt: entry.headerLogoAlt || DEFAULT_ALT_TEXT,
    footer_logo:
      entry.footerLogoEnabled && entry.footerLogo
        ? toMedia(entry.footerLogo)
        : null,
    footer_logo_alt: entry.footerLogoAlt || DEFAULT_ALT_TEXT,
    mobile_logo: mobileLogo,
    mobile_logo_alt:
      entry.useMobileLogo && entry.mobileLogo
        ? entry.mobileLogoAlt || DEFAULT_ALT_TEXT
        : entry.headerLogoAlt || DEFAULT_ALT_TEXT,
    favicon: entry.favicon ? toMedia(entry.favicon) : null,
    product_header_background: entry.productHeaderBackground
      ? toMedia(entry.productHeaderBackground)
      : null,
  };
}
