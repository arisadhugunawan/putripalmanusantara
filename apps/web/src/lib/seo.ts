import type { Metadata } from "next";

/** docs/06-architecture.md §7 — canonical URL base for the whole site. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "CV Putri Palma Nusantara";

interface PageMetadataInput {
  title: string;
  description: string;
  /** Path starting with "/", e.g. "/products/semi-husked-coconut". */
  path: string;
  /** Absolute image URL for OpenGraph/Twitter cards; omit to use the site default. */
  imageUrl?: string;
  type?: "website" | "article";
  /**
   * Set for the Home page only: `title` already contains the full site name, so it must
   * bypass the root layout's "%s | {SITE_NAME}" template instead of being appended to it.
   */
  absoluteTitle?: boolean;
}

/**
 * NFR-SEO-02/04 — every page gets a canonical URL plus OpenGraph and Twitter Card
 * metadata built from the same title/description, so they never drift out of sync.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  imageUrl,
  type = "website",
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = imageUrl ? [{ url: imageUrl }] : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: "en_US",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
