import { DEFAULT_LOCALE, isLocale, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import type { Metadata } from "next";

/** docs/06-architecture.md §7 — canonical URL base for the whole site. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "CV Putri Palma Nusantara";

/** Maps our short locale codes to full OpenGraph locale tags (BCP 47-ish, region-qualified). */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  id: "id_ID",
  zh: "zh_CN",
  th: "th_TH",
  hi: "hi_IN",
  vi: "vi_VN",
};

/** Same region-qualified mapping as `OG_LOCALE`, reformatted with a hyphen for `Intl`/
 * `toLocaleDateString`-style APIs (which want "en-US", not "en_US") — one source of truth for
 * "which real-world locale does our short code correspond to" rather than a second map. */
export function localeToBCP47(locale: Locale): string {
  return OG_LOCALE[locale].replace("_", "-");
}

interface PageMetadataInput {
  title: string;
  description: string;
  /** Path starting with "/", WITHOUT a locale prefix, e.g. "/products/semi-husked-coconut". */
  path: string;
  /**
   * Current locale (the raw route param — [locale]/layout.tsx already 404s on anything
   * invalid, but that guard isn't visible to the type system here, so this stays a plain
   * string and falls back to English defensively rather than requiring an `as Locale` cast
   * at every one of this function's ~10 call sites).
   */
  locale: string;
  /** Absolute image URL for OpenGraph/Twitter cards; omit to use the site default. */
  imageUrl?: string;
  type?: "website" | "article";
  /**
   * Set for the Home page only: `title` already contains the full site name, so it must
   * bypass the root layout's "%s | {SITE_NAME}" template instead of being appended to it.
   */
  absoluteTitle?: boolean;
  /** Admin-settable override (Article SEO "Canonical URL" field) — an absolute URL that
   * replaces the auto-derived canonical when set, e.g. to point at a syndicated original.
   * Only ever comes from CMS content the Admin explicitly typed; never generated from
   * request data, so this can't be used to inject an arbitrary canonical via user input. */
  canonicalOverride?: string | null;
}

/**
 * NFR-SEO-02/04 — every page gets a canonical URL plus OpenGraph and Twitter Card
 * metadata built from the same title/description, so they never drift out of sync.
 * Also emits hreflang alternates across all 6 locales (+ x-default) once path-prefixed
 * locale routing exists — avoids duplicate-content SEO penalties across locale variants.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  locale,
  imageUrl,
  type = "website",
  absoluteTitle = false,
  canonicalOverride,
}: PageMetadataInput): Metadata {
  const resolvedLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const localizedPath = `/${resolvedLocale}${path === "/" ? "" : path}`;
  const url = canonicalOverride || `${SITE_URL}${localizedPath}`;
  const images = imageUrl ? [{ url: imageUrl }] : undefined;

  const languages: Record<string, string> = { "x-default": `${SITE_URL}/${DEFAULT_LOCALE}${path === "/" ? "" : path}` };
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${path === "/" ? "" : path}`;
  }

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: OG_LOCALE[resolvedLocale],
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
