import type { Media } from "./media";

export interface Facility {
  id: string;
  name: string;
  description: string;
  cover_image: Media | null;
  gallery: Media[];
  order: number;
}
