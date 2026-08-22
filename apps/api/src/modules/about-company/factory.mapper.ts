import type {
  FactoryDocument as SharedFactoryDocument,
  FactoryGalleryImage as SharedFactoryGalleryImage,
  FactoryProfile as SharedFactoryProfile,
  FactoryVideo as SharedFactoryVideo,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  FactoryDocumentModel as FactoryDocument,
  FactoryGalleryImageModel as FactoryGalleryImage,
  FactoryProfileModel as FactoryProfile,
  FactoryVideoModel as FactoryVideo,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type FactoryProfileWithRelations = FactoryProfile & {
  gallery: (FactoryGalleryImage & { media: Media })[];
  documents: (FactoryDocument & { file: Media | null })[];
  videos: FactoryVideo[];
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

function toFactoryGalleryImage(
  entry: FactoryGalleryImage & { media: Media },
): SharedFactoryGalleryImage {
  return {
    id: entry.id,
    media: toMedia(entry.media),
    title: entry.title,
    caption: entry.caption,
    category: entry.category,
    alt_text: entry.altText,
    order: entry.order,
    featured: entry.featured,
    active: entry.active,
  };
}

function toFactoryVideo(entry: FactoryVideo): SharedFactoryVideo {
  return {
    id: entry.id,
    title: entry.title,
    tiktok_url: entry.tiktokUrl,
    description: entry.description,
    order: entry.order,
    featured: entry.featured,
    active: entry.active,
  };
}

function toFactoryDocument(
  entry: FactoryDocument & { file: Media | null },
): SharedFactoryDocument {
  return {
    id: entry.id,
    title: entry.title,
    file: entry.file ? toMedia(entry.file) : null,
    description: entry.description,
    order: entry.order,
    active: entry.active,
  };
}

export function toFactoryProfile(
  entry: FactoryProfileWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedFactoryProfile {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'name',
    'shortDescription',
    'detailedDescription',
    'location',
    'operationalInfo',
    'capacity',
    'additionalNotes',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    name: t.name,
    short_description: t.shortDescription,
    detailed_description: t.detailedDescription,
    location: t.location,
    operational_info: t.operationalInfo,
    capacity: t.capacity,
    additional_notes: t.additionalNotes,
    gallery: [...entry.gallery]
      .sort((a, b) => a.order - b.order)
      .map(toFactoryGalleryImage),
    documents: [...entry.documents]
      .sort((a, b) => a.order - b.order)
      .map(toFactoryDocument),
    videos: [...entry.videos]
      .sort((a, b) => a.order - b.order)
      .map(toFactoryVideo),
    translations: entry.translations as SharedFactoryProfile['translations'],
  };
}
