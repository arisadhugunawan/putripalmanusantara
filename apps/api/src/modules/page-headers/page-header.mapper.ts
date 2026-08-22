import {
  PAGE_HEADER_SYSTEM_DEFAULTS as SYSTEM_DEFAULTS,
  type Media as SharedMedia,
  type PageHeader as SharedPageHeader,
  type ResolvedPageHeader,
} from '@ppn/shared-types';
import type {
  MediaModel as Media,
  PageHeaderModel as PageHeader,
} from '../../../generated/prisma/models';

export type PageHeaderWithRelations = PageHeader & {
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

export function toPageHeader(entry: PageHeaderWithRelations): SharedPageHeader {
  return {
    id: entry.id,
    page_key: entry.pageKey,
    is_active: entry.isActive,
    background_image: entry.backgroundImage
      ? toMedia(entry.backgroundImage)
      : null,
    mobile_background_image: entry.mobileBackgroundImage
      ? toMedia(entry.mobileBackgroundImage)
      : null,
    alt_text: entry.altText,
    custom_title: entry.customTitle,
    subtitle: entry.subtitle,
    overlay_enabled: entry.overlayEnabled,
    overlay_type: entry.overlayType,
    overlay_opacity: entry.overlayOpacity,
    background_position: entry.backgroundPosition,
    mobile_background_position: entry.mobileBackgroundPosition,
    height_preset: entry.heightPreset,
    title_color: entry.titleColor,
    subtitle_color: entry.subtitleColor,
    breadcrumb_color: entry.breadcrumbColor,
    show_breadcrumb: entry.showBreadcrumb,
    updated_at: entry.updatedAt.toISOString(),
  };
}

/** Field-by-field 3-tier merge: page-specific row (if active) → global-default row → system
 * constant. `page` is `null` when no row exists yet for this key, or when it exists but
 * `is_active` is false (both treated identically — as if it doesn't exist). */
export function resolvePageHeader(
  page: PageHeaderWithRelations | null,
  global: PageHeaderWithRelations | null,
): ResolvedPageHeader {
  function pick<K extends keyof PageHeaderWithRelations>(key: K) {
    return page?.[key] ?? global?.[key] ?? null;
  }

  const backgroundImage =
    page?.backgroundImage ?? global?.backgroundImage ?? null;
  const mobileBackgroundImage =
    page?.mobileBackgroundImage ??
    global?.mobileBackgroundImage ??
    backgroundImage;

  return {
    background_image: backgroundImage ? toMedia(backgroundImage) : null,
    mobile_background_image: mobileBackgroundImage
      ? toMedia(mobileBackgroundImage)
      : null,
    alt_text: pick('altText'),
    custom_title: page?.customTitle ?? null,
    subtitle: pick('subtitle'),
    overlay_enabled: pick('overlayEnabled') ?? SYSTEM_DEFAULTS.overlay_enabled,
    overlay_type: pick('overlayType') ?? SYSTEM_DEFAULTS.overlay_type,
    overlay_opacity: pick('overlayOpacity') ?? SYSTEM_DEFAULTS.overlay_opacity,
    background_position:
      pick('backgroundPosition') ?? SYSTEM_DEFAULTS.background_position,
    mobile_background_position:
      pick('mobileBackgroundPosition') ??
      pick('backgroundPosition') ??
      SYSTEM_DEFAULTS.mobile_background_position,
    height_preset: pick('heightPreset') ?? SYSTEM_DEFAULTS.height_preset,
    title_color: pick('titleColor') ?? SYSTEM_DEFAULTS.title_color,
    subtitle_color: pick('subtitleColor') ?? SYSTEM_DEFAULTS.subtitle_color,
    breadcrumb_color:
      pick('breadcrumbColor') ?? SYSTEM_DEFAULTS.breadcrumb_color,
    show_breadcrumb: pick('showBreadcrumb') ?? SYSTEM_DEFAULTS.show_breadcrumb,
  };
}
