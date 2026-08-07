import "server-only";
import type {
  ApiResponse,
  ArticleDetail,
  ArticleSummary,
  DecorativeGraphic,
  Facility,
  Faq,
  GalleryCategory,
  GalleryItem,
  HeroSlide,
  HomepageAboutPreview,
  HomepageHighlight,
  HomepageStatistic,
  PaginationMeta,
  PartnerLogo,
  ProductDetail,
  ProductSummary,
  ProductionStep,
  PublicSiteSettings,
} from "@ppn/shared-types";
import { ApiRequestError } from "./api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** docs/06-architecture.md §4 — SSG + periodic ISR for content that changes occasionally. */
const DEFAULT_REVALIDATE_SECONDS = 3600;

async function request<T>(path: string, revalidate: number | false = DEFAULT_REVALIDATE_SECONDS) {
  const res = await fetch(`${API_URL}${path}`, {
    next: revalidate === false ? undefined : { revalidate },
    cache: revalidate === false ? "no-store" : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiRequestError(json.error.message, res.status, json.error.code);
  }
  return json;
}

/** Returns null instead of throwing on 404 — for pages that call notFound(). */
async function requestOrNull<T>(path: string, revalidate?: number | false) {
  try {
    const json = await request<T>(path, revalidate);
    return json.data;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

/** Appends `?locale=` (or `&locale=`) — the locale becomes part of the fetch cache key
 * (`next: { revalidate }` caches per-URL), so different locales never collide in cache. */
function withLocale(path: string, locale?: string) {
  if (!locale) return path;
  return `${path}${path.includes("?") ? "&" : "?"}locale=${encodeURIComponent(locale)}`;
}

export async function getProducts(locale?: string): Promise<ProductSummary[]> {
  const json = await request<ProductSummary[]>(withLocale("/products", locale));
  return json.data;
}

export async function getFeaturedProducts(locale?: string): Promise<ProductSummary[]> {
  const json = await request<ProductSummary[]>(withLocale("/products/featured", locale));
  return json.data;
}

export async function getProductBySlug(slug: string, locale?: string): Promise<ProductDetail | null> {
  return requestOrNull<ProductDetail>(withLocale(`/products/${encodeURIComponent(slug)}`, locale));
}

export async function getArticles(
  page = 1,
  limit = 9,
  locale?: string,
): Promise<{ items: ArticleSummary[]; meta: PaginationMeta }> {
  const json = await request<ArticleSummary[]>(
    withLocale(`/articles?page=${page}&limit=${limit}`, locale),
  );
  return { items: json.data, meta: json.meta as PaginationMeta };
}

export async function getLatestArticles(locale?: string): Promise<ArticleSummary[]> {
  const json = await request<ArticleSummary[]>(withLocale("/articles/latest", locale));
  return json.data;
}

export async function getArticleBySlug(slug: string, locale?: string): Promise<ArticleDetail | null> {
  return requestOrNull<ArticleDetail>(withLocale(`/articles/${encodeURIComponent(slug)}`, locale));
}

export async function getGallery(category?: GalleryCategory, locale?: string): Promise<GalleryItem[]> {
  const query = category ? `?category=${category}` : "";
  const json = await request<GalleryItem[]>(withLocale(`/gallery${query}`, locale));
  return json.data;
}

export async function getFacilities(locale?: string): Promise<Facility[]> {
  const json = await request<Facility[]>(withLocale("/facilities", locale));
  return json.data;
}

export async function getProductionSteps(locale?: string): Promise<ProductionStep[]> {
  const json = await request<ProductionStep[]>(withLocale("/production-steps", locale));
  return json.data;
}

export async function getHomepageStatistics(locale?: string): Promise<HomepageStatistic[]> {
  const json = await request<HomepageStatistic[]>(withLocale("/homepage/statistics", locale));
  return json.data;
}

export async function getFaqs(locale?: string): Promise<Faq[]> {
  const json = await request<Faq[]>(withLocale("/faqs", locale));
  return json.data;
}

export async function getPublicSettings(locale?: string): Promise<PublicSiteSettings> {
  const json = await request<PublicSiteSettings>(withLocale("/settings/public", locale));
  return json.data;
}

export async function getHeroSlides(locale?: string): Promise<HeroSlide[]> {
  const json = await request<HeroSlide[]>(withLocale("/homepage/hero-slides", locale));
  return json.data;
}

export async function getPartnerLogos(locale?: string): Promise<PartnerLogo[]> {
  const json = await request<PartnerLogo[]>(withLocale("/homepage/partner-logos", locale));
  return json.data;
}

export async function getDecorativeGraphics(page: string, locale?: string): Promise<DecorativeGraphic[]> {
  const json = await request<DecorativeGraphic[]>(
    withLocale(`/homepage/decorative-graphics?page=${encodeURIComponent(page)}`, locale),
  );
  return json.data;
}

export async function getAboutPreview(locale?: string): Promise<HomepageAboutPreview> {
  const json = await request<HomepageAboutPreview>(withLocale("/homepage/about-preview", locale));
  return json.data;
}

export async function getHighlights(locale?: string): Promise<HomepageHighlight[]> {
  const json = await request<HomepageHighlight[]>(withLocale("/homepage/highlights", locale));
  return json.data;
}
