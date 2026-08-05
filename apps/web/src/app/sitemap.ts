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

/**
 * NFR-SEO-03 / docs/06-architecture.md §7 — dynamic sitemap generated from published
 * Product and Article data, per docs/05-api.md §3.10.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, { items: articles }] = await Promise.all([
    getProducts(),
    getArticles(1, 100),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: new Date(),
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/articles/${article.slug}`,
    lastModified: article.published_at,
  }));

  return [...staticEntries, ...productEntries, ...articleEntries];
}
