import { GLOBAL_DEFAULT_PAGE_HEADER_KEY, type PageHeaderKey } from "@ppn/shared-types";

/** Display labels for the Page Header Management list + editor, in the exact order they
 * should appear (mirrors the public site's own page order, same convention as `AdminNav`'s
 * `CONTENT_NAV`). */
export const PAGE_HEADER_LABELS: Record<PageHeaderKey, string> = {
  "about-company": "About Company",
  products: "Our Products",
  "product-detail": "Product Detail",
  facilities: "Facilities",
  gallery: "Gallery",
  news: "News",
};

export const PAGE_HEADER_ORDER: PageHeaderKey[] = [
  "about-company",
  "products",
  "product-detail",
  "facilities",
  "gallery",
  "news",
];

export function pageHeaderLabel(pageKey: string): string {
  if (pageKey === GLOBAL_DEFAULT_PAGE_HEADER_KEY) return "Global Default Header";
  return PAGE_HEADER_LABELS[pageKey as PageHeaderKey] ?? pageKey;
}
