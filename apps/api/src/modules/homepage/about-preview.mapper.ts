import type {
  HomepageAboutPreview as SharedAboutPreview,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  HomepageAboutPreviewModel as AboutPreview,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type AboutPreviewWithRelations = AboutPreview & {
  videoMedia: Media | null;
  videoThumbnail: Media | null;
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

export function toAboutPreview(
  entry: AboutPreviewWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedAboutPreview {
  const t = translate(entry, entry.translations, locale, [
    'label',
    'heading',
    'paragraph1',
    'paragraph2',
    'paragraph3',
    'ctaText',
  ]);
  return {
    id: entry.id,
    label: t.label,
    heading: t.heading,
    paragraph_1: t.paragraph1,
    paragraph_2: t.paragraph2,
    paragraph_3: t.paragraph3,
    cta_text: t.ctaText,
    cta_link: entry.ctaLink,
    video_source: entry.videoSource,
    video_url: entry.videoUrl,
    video_media: entry.videoMedia ? toMedia(entry.videoMedia) : null,
    video_thumbnail: entry.videoThumbnail
      ? toMedia(entry.videoThumbnail)
      : null,
    enabled: entry.enabled,
    translations: entry.translations as SharedAboutPreview['translations'],
  };
}
