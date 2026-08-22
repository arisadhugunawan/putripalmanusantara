import type { Translations } from "./i18n";
import type { Media } from "./media";

/** One photo in a facility's gallery — field-for-field mirror of `FactoryGalleryImage` so the
 * admin gallery editor and public lightbox can be shared/generalized between the two entities. */
export interface FacilityGalleryImageItem {
  id: string;
  media: Media;
  title: string | null;
  caption: string | null;
  category: string | null;
  alt_text: string | null;
  order: number;
  featured: boolean;
  active: boolean;
}

export interface Facility {
  id: string;
  /** Stable identifier for the fixed 10-facility master list — used by the frontend to look up
   * each facility's icon. Never admin-editable. */
  slug: string;
  name: string;
  description: string;
  cover_image: Media | null;
  /** Optional metadata — never shown on the public site when empty (brief: "Jangan tampilkan
   * jika kosong"). */
  facility_type: string | null;
  location: string | null;
  status: string | null;
  gallery: FacilityGalleryImageItem[];
  order: number;
  active: boolean;
  featured: boolean;
  translations?: Translations | null;
}
