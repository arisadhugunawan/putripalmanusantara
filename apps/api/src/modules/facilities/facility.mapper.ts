import type {
  Facility as SharedFacility,
  Media as SharedMedia,
} from '@ppn/shared-types';
import type {
  FacilityModel as Facility,
  FacilityGalleryImageModel as FacilityGalleryImage,
  MediaModel as Media,
} from '../../../generated/prisma/models';

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

export function toFacility(facility: FacilityWithRelations): SharedFacility {
  return {
    id: facility.id,
    name: facility.name,
    description: facility.description,
    cover_image: facility.coverImage ? toMedia(facility.coverImage) : null,
    gallery: (facility.gallery ?? [])
      .sort((a, b) => a.order - b.order)
      .map((item) => toMedia(item.media)),
    order: facility.order,
  };
}
