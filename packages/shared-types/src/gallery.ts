import type { Media } from "./media";

export const GALLERY_MEDIA_TYPES = ["image", "video", "youtube", "tiktok"] as const;
export type GalleryMediaType = (typeof GALLERY_MEDIA_TYPES)[number];

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

export interface GalleryItem {
  id: string;
  media_type: GalleryMediaType;
  media: Media | null;
  external_url: string | null;
  category: GalleryCategory;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  location: string | null;
  captured_at: string | null;
  short_description: string | null;
  featured: boolean;
  active: boolean;
  order: number;
  translations?: Record<string, Record<string, string>> | null;
}
