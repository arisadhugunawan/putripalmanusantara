import "server-only";
import type {
  ApiResponse,
  ArticleCategory,
  ArticleDetail,
  ArticleSummary,
  DecorativeGraphic,
  ExportDestination,
  Facility,
  Faq,
  GalleryCategory,
  GalleryItem,
  HeroSlide,
  HomepageAboutPreview,
  HomepageExportReach,
  HomepageHighlight,
  HomepagePartnersSection,
  HomepageShippingSection,
  HomepageStatistic,
  PaginationMeta,
  PartnerLogo,
  ProductDetail,
  ProductSummary,
  PublicSiteBranding,
  PublicSiteSettings,
  PublishedAboutCompanyPayload,
  PublishedContactPagePayload,
  PublicFooterSettings,
  PublishedHomepagePayload,
  ResolvedPageHeader,
  ShippingPartner,
} from "@ppn/shared-types";
import { ApiRequestError } from "./api-error";
import { DEFAULT_ABOUT_NAV_STATE, type AboutNavState } from "./nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** docs/06-architecture.md §4 — SSG + periodic ISR for content that changes occasionally. */
const DEFAULT_REVALIDATE_SECONDS = 3600;

// In development, always fetch fresh instead of using ISR's time-based cache. `next dev`
// (Turbopack) persists its data/route cache to disk across requests and — unlike production —
// on-demand revalidatePath() calls don't reliably invalidate it, so an Admin save could still
// serve stale content on localhost until a manual `.next` wipe. Skipping the cache entirely in
// dev sidesteps that: every request re-fetches, so Admin changes always show up immediately.
// Production is unaffected — it still uses `next: { revalidate }` + on-demand revalidatePath()
// exactly as before.
const IS_DEV = process.env.NODE_ENV !== "production";

async function request<T>(path: string, revalidate: number | false = DEFAULT_REVALIDATE_SECONDS) {
  const noStore = revalidate === false || IS_DEV;
  const res = await fetch(`${API_URL}${path}`, {
    next: noStore ? undefined : { revalidate },
    cache: noStore ? "no-store" : undefined,
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
  filters?: { q?: string; categoryId?: string; featured?: boolean },
): Promise<{ items: ArticleSummary[]; meta: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.q?.trim()) params.set("q", filters.q.trim());
  if (filters?.categoryId) params.set("category_id", filters.categoryId);
  if (filters?.featured !== undefined) params.set("featured", String(filters.featured));
  // Search/filtered results must never serve a stale cached page — only the plain, unfiltered
  // listing benefits from ISR.
  const revalidate = filters?.q || filters?.categoryId ? (false as const) : undefined;
  const json = await request<ArticleSummary[]>(withLocale(`/articles?${params}`, locale), revalidate);
  return { items: json.data, meta: json.meta as PaginationMeta };
}

export async function getLatestArticles(locale?: string): Promise<ArticleSummary[]> {
  const json = await request<ArticleSummary[]>(withLocale("/articles/latest", locale));
  return json.data;
}

export async function getArticleCategories(locale?: string): Promise<ArticleCategory[]> {
  const json = await request<ArticleCategory[]>(withLocale("/articles/categories", locale));
  return json.data;
}

export async function getArticleBySlug(slug: string, locale?: string): Promise<ArticleDetail | null> {
  return requestOrNull<ArticleDetail>(withLocale(`/articles/${encodeURIComponent(slug)}`, locale));
}

export async function getRelatedArticles(slug: string, locale?: string): Promise<ArticleSummary[]> {
  const json = await request<ArticleSummary[]>(withLocale(`/articles/${encodeURIComponent(slug)}/related`, locale));
  return json.data;
}

export async function getGallery(categorySlug?: string, locale?: string): Promise<GalleryItem[]> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  const json = await request<GalleryItem[]>(withLocale(`/gallery${query}`, locale));
  return json.data;
}

export async function getGalleryCategories(locale?: string): Promise<GalleryCategory[]> {
  const json = await request<GalleryCategory[]>(withLocale("/gallery/categories", locale));
  return json.data;
}

/** Facilities moved under the About Company Draft/Publish system (see README "About Company →
 * Facilities") — this now reads from the same published snapshot `/about` uses, instead of a
 * standalone always-live endpoint. Next's fetch cache dedupes this against `/about`'s own
 * `getPublishedAboutCompany()` call within one render pass, so the `/facilities` page pays for
 * the request only once even though it (and `/about`, and the Homepage teaser) all call this. */
export async function getFacilities(locale?: string): Promise<Facility[]> {
  const data = await getPublishedAboutCompany(locale);
  return data.facilities;
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

/** Header/Footer/Mobile logo + Favicon — rendered on every page via [locale]/layout.tsx and
 * the root layout, so this is cached like any other rarely-changing CMS content. */
export async function getPublicBranding(): Promise<PublicSiteBranding> {
  const json = await request<PublicSiteBranding>("/branding");
  return json.data;
}

/** Inner Page Header (Admin → Settings → Inner Page Header) — already fully resolved through
 * the page-specific → global-default → system-constant chain, ready to pass straight into
 * `PageHeader`'s `headerConfig` prop. Never throws: a page whose header module is unreachable
 * should still render with its plain default look rather than fail the whole page. */
export async function getPageHeader(
  pageKey: string,
  locale?: string,
): Promise<ResolvedPageHeader | null> {
  try {
    const json = await request<ResolvedPageHeader>(withLocale(`/page-headers/${pageKey}`, locale));
    return json.data;
  } catch {
    return null;
  }
}

/** Footer Management (Admin → Settings → Footer) — enable toggles, brand-area copy, background
 * treatment, CTA copy. Contact info/social links/office locations are deliberately NOT part of
 * this payload; the Footer component fetches those separately via `getPublicContactPage()`. */
export async function getFooterSettings(locale?: string): Promise<PublicFooterSettings> {
  const json = await request<PublicFooterSettings>(withLocale("/footer", locale));
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

export async function getPartnersSection(locale?: string): Promise<HomepagePartnersSection> {
  const json = await request<HomepagePartnersSection>(withLocale("/homepage/partners-section", locale));
  return json.data;
}

export async function getExportDestinations(locale?: string): Promise<ExportDestination[]> {
  const json = await request<ExportDestination[]>(withLocale("/homepage/export-destinations", locale));
  return json.data;
}

export async function getExportReachSection(locale?: string): Promise<HomepageExportReach> {
  const json = await request<HomepageExportReach>(withLocale("/homepage/export-reach-section", locale));
  return json.data;
}

export async function getShippingPartners(locale?: string): Promise<ShippingPartner[]> {
  const json = await request<ShippingPartner[]>(withLocale("/homepage/shipping-partners", locale));
  return json.data;
}

export async function getShippingSection(locale?: string): Promise<HomepageShippingSection> {
  const json = await request<HomepageShippingSection>(withLocale("/homepage/shipping-section", locale));
  return json.data;
}

/** The Homepage's single data source for its CMS-owned sections (Draft/Publish — see README
 * "Homepage Manager"). Featured Products/Facilities/Gallery/Production Steps/Articles are NOT
 * part of this payload — those keep being fetched live, unchanged, via their own `get*`
 * functions below. Same default ISR window as every other call here — Publish already forces
 * an immediate on-demand revalidation via the existing webhook, same as every other mutation. */
export async function getPublishedHomepage(locale?: string): Promise<PublishedHomepagePayload> {
  const json = await request<PublishedHomepagePayload>(withLocale("/homepage/published-snapshot", locale));
  return json.data;
}

/** The About Company page's single data source (Draft/Publish — see README "About Company
 * Manager"), mirrors `getPublishedHomepage` exactly. */
export async function getPublishedAboutCompany(locale?: string): Promise<PublishedAboutCompanyPayload> {
  const json = await request<PublishedAboutCompanyPayload>(
    withLocale("/about-company/published-snapshot", locale),
  );
  return json.data;
}

/** The Contact page's single data source (Draft/Publish — see README "Contact Page — Full
 * Redesign"). No `locale` param: unlike Homepage/About Company, none of this payload's fields
 * are ever translated — real addresses/email/phone numbers/URLs stay identical in every
 * language (brief §32). Returns `null` when nothing has ever been published, or after an
 * explicit Unpublish — callers should render the page as if no data exists rather than
 * throwing, exactly like every other "not yet configured" gap in this project. */
export async function getPublicContactPage(): Promise<PublishedContactPagePayload | null> {
  const json = await request<PublishedContactPagePayload | null>("/contact-page");
  return json.data;
}

/**
 * Header/Footer view of the same published About Company snapshot: just enough to decide
 * whether the About Company menu (and each of its anchors) should appear at all.
 *
 * Best-effort — a failure falls back to showing the full menu rather than dropping items out of
 * the site's main navigation because of one API blip. Within a single render this shares
 * Next's fetch cache with `getPublishedAboutCompany()` on the `/about` route, so the About page
 * itself does not pay for a second request.
 */
export async function getPublicAboutCompanyNav(locale?: string): Promise<AboutNavState> {
  try {
    const data = await getPublishedAboutCompany(locale);
    return {
      pageVisible: data.settings.visible,
      visibleSections: data.section_config.filter((section) => section.visible).map((section) => section.key),
    };
  } catch {
    return DEFAULT_ABOUT_NAV_STATE;
  }
}
