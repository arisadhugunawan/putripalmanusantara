import type {
  GalleryItem as SharedGalleryItem,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  GalleryCategoryModel as GalleryCategory,
  GalleryItemModel as GalleryItem,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';
import { toGalleryCategory } from './gallery-category.mapper';

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

export function toGalleryItem(
  entry: GalleryItem & { media: Media | null; category: GalleryCategory },
  locale: string = DEFAULT_LOCALE,
): SharedGalleryItem {
  const t = translate(entry, entry.translations, locale, [
    'title',
    'caption',
    'shortDescription',
  ]);
  return {
    id: entry.id,
    media_type: entry.mediaType,
    media: entry.media ? toMedia(entry.media) : null,
    external_url: entry.externalUrl,
    category: toGalleryCategory(entry.category, locale),
    title: t.title,
    caption: t.caption,
    alt_text: entry.altText,
    location: entry.location,
    captured_at: entry.capturedAt ? entry.capturedAt.toISOString() : null,
    short_description: t.shortDescription,
    featured: entry.featured,
    active: entry.active,
    order: entry.order,
    translations: entry.translations as SharedGalleryItem['translations'],
  };
}
