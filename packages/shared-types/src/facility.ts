import type { Media } from "./media";
import type { Translations } from "./i18n";

/** `id` is the gallery row's own id (distinct from `media.id`) — needed to call
 * `DELETE /admin/facilities/:id/gallery/:galleryId`, same shape as `ProductGalleryItem`. */
export interface FacilityGalleryImageItem {
  id: string;
  media: Media;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  cover_image: Media | null;
  gallery: FacilityGalleryImageItem[];
  order: number;
  /** Admin-only — see ProductDetail['translations']. */
  translations?: Translations | null;
}
