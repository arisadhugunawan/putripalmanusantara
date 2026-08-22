import type {
  AboutCompanySettings as SharedSettings,
  Media as SharedMedia,
} from '@ppn/shared-types';
import type {
  AboutCompanySettingsModel as Settings,
  MediaModel as Media,
} from '../../../generated/prisma/models';

type SettingsWithRelations = Settings & { ogImage: Media | null };

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

export function toAboutCompanySettings(
  entry: SettingsWithRelations,
): SharedSettings {
  return {
    id: entry.id,
    page_title: entry.pageTitle,
    page_subtitle: entry.pageSubtitle,
    seo_title: entry.seoTitle,
    seo_description: entry.seoDescription,
    og_image: entry.ogImage ? toMedia(entry.ogImage) : null,
    visible: entry.visible,
  };
}
