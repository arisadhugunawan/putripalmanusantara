import type {
  Facility as SharedFacility,
  FacilityGalleryImageItem as SharedFacilityGalleryImage,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  FacilityModel as Facility,
  FacilityGalleryImageModel as FacilityGalleryImage,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type FacilityWithRelations = Facility & {
  coverImage: Media | null;
  gallery: (FacilityGalleryImage & { media: Media })[];
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

function toFacilityGalleryImage(
  entry: FacilityGalleryImage & { media: Media },
): SharedFacilityGalleryImage {
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

export function toFacility(
  facility: FacilityWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedFacility {
  const t = translate(facility, facility.translations, locale, [
    'name',
    'description',
    'facilityType',
    'location',
    'status',
  ]);
  return {
    id: facility.id,
    slug: facility.slug,
    name: t.name,
    description: t.description,
    cover_image: facility.coverImage ? toMedia(facility.coverImage) : null,
    facility_type: t.facilityType,
    location: t.location,
    status: t.status,
    gallery: [...facility.gallery]
      .sort((a, b) => a.order - b.order)
      .map(toFacilityGalleryImage),
    order: facility.order,
    active: facility.active,
    featured: facility.featured,
    translations: facility.translations as SharedFacility['translations'],
  };
}
