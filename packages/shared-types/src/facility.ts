import type { Media } from "./media";
import type { Translations } from "./i18n";

export interface Facility {
  id: string;
  name: string;
  description: string;
  cover_image: Media | null;
  gallery: Media[];
  order: number;
  /** Admin-only — see ProductDetail['translations']. */
  translations?: Translations | null;
}
