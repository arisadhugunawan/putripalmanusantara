import "server-only";
import type {
  ApiResponse,
  ArticleDetail,
  ArticleSummary,
  Facility,
  Faq,
  GalleryCategory,
  GalleryItem,
  HomepageStatistic,
  PaginationMeta,
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

export async function getProducts(): Promise<ProductSummary[]> {
  const json = await request<ProductSummary[]>("/products");
  return json.data;
}

export async function getFeaturedProducts(): Promise<ProductSummary[]> {
  const json = await request<ProductSummary[]>("/products/featured");
  return json.data;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return requestOrNull<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}

export async function getArticles(
  page = 1,
  limit = 9,
): Promise<{ items: ArticleSummary[]; meta: PaginationMeta }> {
  const json = await request<ArticleSummary[]>(`/articles?page=${page}&limit=${limit}`);
  return { items: json.data, meta: json.meta as PaginationMeta };
}

export async function getLatestArticles(): Promise<ArticleSummary[]> {
  const json = await request<ArticleSummary[]>("/articles/latest");
  return json.data;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  return requestOrNull<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`);
}

export async function getGallery(category?: GalleryCategory): Promise<GalleryItem[]> {
  const query = category ? `?category=${category}` : "";
  const json = await request<GalleryItem[]>(`/gallery${query}`);
  return json.data;
}

export async function getFacilities(): Promise<Facility[]> {
  const json = await request<Facility[]>("/facilities");
  return json.data;
}

export async function getProductionSteps(): Promise<ProductionStep[]> {
  const json = await request<ProductionStep[]>("/production-steps");
  return json.data;
}

export async function getHomepageStatistics(): Promise<HomepageStatistic[]> {
  const json = await request<HomepageStatistic[]>("/homepage/statistics");
  return json.data;
}

export async function getFaqs(): Promise<Faq[]> {
  const json = await request<Faq[]>("/faqs");
  return json.data;
}

export async function getPublicSettings(): Promise<PublicSiteSettings> {
  const json = await request<PublicSiteSettings>("/settings/public");
  return json.data;
}
