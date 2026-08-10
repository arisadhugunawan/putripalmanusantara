import type {
  Facility as SharedFacility,
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
  gallery?: (FacilityGalleryImage & { media: Media })[];
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

export function toFacility(
  facility: FacilityWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedFacility {
  const t = translate(facility, facility.translations, locale, [
    'name',
    'description',
  ]);
  return {
    id: facility.id,
    name: t.name,
    description: t.description,
    cover_image: facility.coverImage ? toMedia(facility.coverImage) : null,
    gallery: (facility.gallery ?? [])
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ id: item.id, media: toMedia(item.media) })),
    order: facility.order,
    translations: facility.translations as SharedFacility['translations'],
  };
}
