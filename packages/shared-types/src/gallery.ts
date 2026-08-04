import type { Media } from "./media";

export type GalleryCategory = "product" | "facility" | "production" | "drone";

export interface GalleryItem {
  id: string;
  media: Media;
  category: GalleryCategory;
  caption: string | null;
  order: number;
}
