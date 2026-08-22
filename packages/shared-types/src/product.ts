import type { Media } from "./media";
import type { Translations } from "./i18n";

/** GET /admin/products/{id}/translation-status — one entry per non-English `SUPPORTED_LOCALES`
 * member, letting Admin see translation coverage without opening every LocaleTabs tab. */
export type ProductTranslationCoverage = "translated" | "partial" | "not_translated";

export interface ProductTranslationStatusEntry {
  locale: string;
  status: ProductTranslationCoverage;
  fields_translated: number;
  fields_total: number;
}

/** POST /admin/products/{id}/translations/generate — no MT provider is configured in this
 * project, so this always degrades honestly instead of fabricating translations. */
export interface GenerateTranslationsResult {
  available: false;
  reason: "not_configured";
  message: string;
}

export const PRODUCT_CATEGORIES = [
  "Semi Husked Coconut",
  "Copra",
  "Coconut Shell Charcoal",
  "Coconut Timber",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ContentStatus = "draft" | "published";

/** "specification" = Section 5 physical/technical spec cards; "export_info" = Section 9
 * commercial export-terms cards (MOQ, Incoterms, etc.) — same flexible key/value row shape,
 * distinguished only by this field so no new model/CRUD surface was needed. */
export type ProductSpecificationGroup = "specification" | "export_info" | "detail_info";

export interface ProductSpecification {
  id: string;
  spec_key: string;
  spec_value: string;
  order: number;
  group: ProductSpecificationGroup;
  /** Optional named sub-group within `group` — a product with several grades/variants (e.g.
   * "Edible (White Copra)", "Regular (White Copra)") groups its spec rows under this label
   * instead of one flat mixed table. Null for the common case of a single ungrouped set. */
  variant_label: string | null;
}

export type ProductPackagingApplicationType = "packaging" | "application";

export interface ProductPackagingApplication {
  id: string;
  type: ProductPackagingApplicationType;
  title: string;
  description: string;
  media: Media | null;
  order: number;
}

export interface ProductDownload {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

/** Where a product media item appears on the detail page. */
export type ProductMediaSection = "gallery" | "spec_lab";

export const PRODUCT_MEDIA_SECTIONS: ProductMediaSection[] = ["gallery", "spec_lab"];

export const PRODUCT_MEDIA_SECTION_LABELS: Record<ProductMediaSection, string> = {
  gallery: "Galeri Produk",
  spec_lab: "Specification & Lab. Test",
};

/** One shape/size option. `sizes` is free text, one entry per line. */
export interface ProductShape {
  id: string;
  name: string;
  media: Media | null;
  sizes: string;
  order: number;
}

export interface ProductGalleryItem {
  id: string;
  media: Media;
  /** `spec_lab` items render under "Specification & Lab. Test", not in the media rail. */
  section: ProductMediaSection;
  /** Optional caption, mainly for spec/lab documents. */
  caption: string | null;
  order: number;
}

/** Card / listing shape — GET /products, /products/featured */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  /** Leading portion of `name` shown in the brand accent colour, when set and it is an exact
   * prefix of `name`. Null means the title renders as one plain colour. */
  title_accent: string | null;
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
  shapes: ProductShape[];
  specifications: ProductSpecification[];
  packaging: ProductPackagingApplication[];
  applications: ProductPackagingApplication[];
  downloads: ProductDownload[];
  created_at: string;
  updated_at: string;
  /** Admin-only — present so the CMS can populate LocaleTabs; absent on public responses
   * where the mapper already resolved a single locale's content into the fields above. */
  translations?: Translations | null;
  /** Admin-only (Post-Launch Products publish/version-history) — when this product last had a
   * snapshot published, or null if it has never been published. */
  last_published_at?: string | null;
  /** Admin-only — true when the draft row has been edited since `last_published_at` (or has
   * never been published at all), i.e. the public site is not yet showing the current draft. */
  has_unpublished_changes?: boolean;
}

/** GET /admin/products/{id}/snapshots — one entry per published version, newest first. */
export interface ProductSnapshotSummary {
  id: string;
  version: number;
  published_at: string;
  published_by_name: string;
}
