import { SUPPORTED_LOCALES } from "@ppn/shared-types";
import type { MetadataRoute } from "next";
import { getArticles, getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  "",
  "/about",
  "/products",
  "/production-process",
  "/facilities",
  "/gallery",
  "/contact",
  "/articles",
];

function localizedUrl(locale: string, path: string) {
  return `${SITE_URL}/${locale}${path}`;
}

function languageAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = localizedUrl(locale, path);
  }
  return languages;
}

/**
 * NFR-SEO-03 / docs/06-architecture.md §7 — dynamic sitemap generated from published
 * Product and Article data, per docs/05-api.md §3.10. Emits one entry per locale per
 * page (path-prefixed i18n routing — see README "Internationalization" section), with
 * hreflang alternates on every entry so locale variants aren't flagged as duplicate content.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, { items: articles }] = await Promise.all([
    getProducts(),
    getArticles(1, 100),
  ]);

  const paths = [
    ...STATIC_ROUTES,
    ...products.map((product) => `/products/${product.slug}`),
    ...articles.map((article) => `/articles/${article.slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    const article = articles.find((a) => `/articles/${a.slug}` === path);
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: localizedUrl(locale, path),
        lastModified: article ? article.published_at : new Date(),
        alternates: { languages: languageAlternates(path) },
      });
    }
  }

  return entries;
}
