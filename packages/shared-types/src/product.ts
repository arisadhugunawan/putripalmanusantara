import type { Media } from "./media";

export const PRODUCT_CATEGORIES = [
  "Semi Husked Coconut",
  "Copra",
  "Coconut Shell Charcoal",
  "Coconut Timber",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ContentStatus = "draft" | "published";

export interface ProductSpecification {
  id: string;
  spec_key: string;
  spec_value: string;
  order: number;
}

export type ProductPackagingApplicationType = "packaging" | "application";

export interface ProductPackagingApplication {
  id: string;
  type: ProductPackagingApplicationType;
  title: string;
  description: string;
  media: Media | null;
}

export interface ProductDownload {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface ProductGalleryItem {
  id: string;
  media: Media;
  order: number;
}

/** Card / listing shape — GET /products, /products/featured */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory | string;
  short_description: string;
  cover_image: Media | null;
  is_featured: boolean;
}

/** Full detail shape — GET /products/{slug} */
export interface ProductDetail extends ProductSummary {
  full_description: string;
  meta_title: string | null;
  meta_description: string | null;
  status: ContentStatus;
  order: number;
  gallery: ProductGalleryItem[];
  specifications: ProductSpecification[];
  packaging: ProductPackagingApplication[];
  applications: ProductPackagingApplication[];
  downloads: ProductDownload[];
  created_at: string;
  updated_at: string;
}
