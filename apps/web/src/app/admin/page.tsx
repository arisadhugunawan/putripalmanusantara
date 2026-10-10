"use client";

import { Badge, Card, cn } from "@ppn/ui-components";
import type {
  ArticleDetail,
  Facility,
  GalleryItem,
  LegalCertificateDocument,
  Locale,
  ProductDetail,
  QuotationRequest,
} from "@ppn/shared-types";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@ppn/shared-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import {
  AboutCompanyIcon,
  CertificateIcon,
  ContactIcon,
  FacilitiesIcon,
  GalleryIcon,
  GlobeIcon,
  HomeIcon,
  InquiryIcon,
  MediaIcon,
  NewsIcon,
  ProductsIcon,
} from "@/components/admin/AdminNavIcons";
import { Skeleton } from "@/components/admin/Skeleton";

interface TranslationStatusEntry {
  locale: Locale;
  status: "translated" | "partial" | "not_translated";
  fields_translated: number;
  fields_total: number;
}

interface DashboardData {
  products: ProductDetail[];
  facilities: Facility[];
  galleryItems: GalleryItem[];
  articles: ArticleDetail[];
  legalDocs: LegalCertificateDocument[];
  quotations: QuotationRequest[];
  mediaTotal: number;
  translationStatuses: Record<string, TranslationStatusEntry[]>;
  /** Captured once when the data was fetched (not read fresh during render, which React's
   * purity rules flag `Date.now()` for) — used to bucket inquiries into "this week"/"this
   * month" windows relative to that same fixed moment. */
  loadedAt: number;
}

const NON_ENGLISH_LOCALES = SUPPORTED_LOCALES.filter((l) => l !== "en");
const DAY_MS = 24 * 60 * 60 * 1000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * "PPN Website Control Center" — every number here is a real, live count from the same
 * endpoints the rest of the Admin already uses (see README "Dashboard"); nothing is hardcoded
 * or simulated. Deliberately does NOT include a Recent Activity timeline, Media
 * optimization/storage stats, or an aggregate SEO score — none of those have a real data
 * source anywhere in this app yet (no audit log, no file-size tracking, no optimization
 * pipeline, no SEO scoring rubric), and fabricating numbers for them would violate the one
 * rule that matters most on this page: never show a fake progress bar.
 */
export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [contentTab, setContentTab] = useState<"products" | "news" | "gallery">("products");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [products, facilities, galleryItems, articles, legalDocs, quotationsResult, mediaResult] =
        await Promise.all([
          adminApi.get<ProductDetail[]>("/admin/products"),
          adminApi.get<Facility[]>("/admin/about-company/facilities"),
          adminApi.get<GalleryItem[]>("/admin/gallery"),
          adminApi.get<ArticleDetail[]>("/admin/articles"),
          adminApi.get<LegalCertificateDocument[]>("/admin/about-company/legal-documents"),
          adminApi.getPaginated<QuotationRequest[]>("/admin/quotation-requests?limit=100"),
          adminApi.getPaginated<never[]>("/admin/media?limit=1"),
        ]);

      const statusEntries = await Promise.all(
        products.map(async (product) => {
          try {
            const result = await adminApi.get<TranslationStatusEntry[]>(
              `/admin/products/${product.id}/translation-status`,
            );
            return [product.id, result] as const;
          } catch {
            return [product.id, []] as const;
          }
        }),
      );

      setData({
        products,
        facilities,
        galleryItems,
        articles,
        legalDocs,
        quotations: quotationsResult.data,
        mediaTotal: mediaResult.meta?.total ?? 0,
        translationStatuses: Object.fromEntries(statusEntries),
        loadedAt: Date.now(),
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  if (status === "error") {
    return <AdminLoadError message="Unable to load dashboard data." onRetry={() => void load()} />;
  }

  if (status === "loading" || !data) {
    return <DashboardSkeleton />;
  }

  return <DashboardContent data={data} contentTab={contentTab} onContentTabChange={setContentTab} />;
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64" />
    </div>
  );
}

function DashboardContent({
  data,
  contentTab,
  onContentTabChange,
}: {
  data: DashboardData;
  contentTab: "products" | "news" | "gallery";
  onContentTabChange: (tab: "products" | "news" | "gallery") => void;
}) {
  const { products, facilities, galleryItems, articles, legalDocs, quotations, mediaTotal, translationStatuses, loadedAt } =
    data;

  // ── Website Overview ────────────────────────────────────────────────
  const statCards = [
    { label: "Products", value: products.length, icon: ProductsIcon, href: "/admin/produk", sub: "Published products" },
    { label: "Facilities", value: facilities.length, icon: FacilitiesIcon, href: "/admin/about-company/facilities", sub: "Master facility list" },
    { label: "Gallery", value: galleryItems.length, icon: GalleryIcon, href: "/admin/galeri/media", sub: "Photos & videos" },
    { label: "News", value: articles.length, icon: NewsIcon, href: "/admin/artikel", sub: "Published articles" },
    { label: "Certificates", value: legalDocs.length, icon: CertificateIcon, href: "/admin/about-company/legal_certificate", sub: "Legal documents" },
    { label: "Inquiries", value: quotations.length, icon: InquiryIcon, href: "/admin/kontak", sub: "Buyer quotation requests" },
    { label: "Languages", value: SUPPORTED_LOCALES.length, icon: GlobeIcon, href: "/admin/pengaturan", sub: "Supported locales" },
    { label: "Media", value: mediaTotal, icon: MediaIcon, href: "/admin/media", sub: "Files in the library" },
  ];

  // ── Content Health (all real, computed below) ───────────────────────
  const productsWithSeo = products.filter((p) => p.meta_title?.trim() && p.meta_description?.trim());
  const seoCompleteness = products.length ? Math.round((productsWithSeo.length / products.length) * 100) : 100;

  const facilitiesWithPhotos = facilities.filter((f) => f.gallery.length > 0);
  const facilityPhotoCompleteness = facilities.length
    ? Math.round((facilitiesWithPhotos.length / facilities.length) * 100)
    : 100;

  const imageItems = galleryItems.filter((g) => g.media_type === "image");
  const imagesWithAlt = imageItems.filter((g) => g.alt_text?.trim());
  const galleryAltCompleteness = imageItems.length ? Math.round((imagesWithAlt.length / imageItems.length) * 100) : 100;

  const localeTotals = new Map<Locale, { translated: number; total: number }>();
  for (const locale of NON_ENGLISH_LOCALES) localeTotals.set(locale, { translated: 0, total: 0 });
  for (const entries of Object.values(translationStatuses)) {
    for (const entry of entries) {
      const bucket = localeTotals.get(entry.locale);
      if (!bucket) continue;
      bucket.translated += entry.fields_translated;
      bucket.total += entry.fields_total;
    }
  }
  const localeCoverage = NON_ENGLISH_LOCALES.map((locale) => {
    const bucket = localeTotals.get(locale)!;
    const pct = bucket.total > 0 ? Math.round((bucket.translated / bucket.total) * 100) : 100;
    return { locale, pct };
  });
  const overallTranslationCoverage = localeCoverage.length
    ? Math.round(localeCoverage.reduce((sum, l) => sum + l.pct, 0) / localeCoverage.length)
    : 100;

  const healthBars = [
    { label: "Products SEO (title + description)", pct: seoCompleteness, href: "/admin/produk" },
    { label: "Facilities with photos", pct: facilityPhotoCompleteness, href: "/admin/about-company/facilities" },
    { label: "Gallery images with ALT text", pct: galleryAltCompleteness, href: "/admin/galeri/media" },
    { label: "Product translations (avg. across 5 languages)", pct: overallTranslationCoverage, href: "/admin/produk" },
  ];

  // ── Content Alerts (derived from the same real checks above) ────────
  const missingSeoCount = products.length - productsWithSeo.length;
  const missingAltCount = imageItems.length - imagesWithAlt.length;
  const facilitiesMissingPhotoCount = facilities.length - facilitiesWithPhotos.length;
  const incompleteTranslationCount = products.filter((p) =>
    (translationStatuses[p.id] ?? []).some((entry) => entry.status !== "translated"),
  ).length;

  const alerts = [
    missingSeoCount > 0 && {
      text: `${missingSeoCount} product${missingSeoCount > 1 ? "s" : ""} have incomplete SEO title/description`,
      href: "/admin/produk",
    },
    missingAltCount > 0 && {
      text: `${missingAltCount} gallery image${missingAltCount > 1 ? "s" : ""} have missing ALT text`,
      href: "/admin/galeri/media",
    },
    facilitiesMissingPhotoCount > 0 && {
      text: `${facilitiesMissingPhotoCount} facilit${facilitiesMissingPhotoCount > 1 ? "ies" : "y"} have no gallery image`,
      href: "/admin/about-company/facilities",
    },
    incompleteTranslationCount > 0 && {
      text: `${incompleteTranslationCount} product${incompleteTranslationCount > 1 ? "s" : ""} have incomplete translations`,
      href: "/admin/produk",
    },
  ].filter((a): a is { text: string; href: string } => Boolean(a));

  // ── Buyer Inquiries (real counts + real recent list) ─────────────────
  const now = loadedAt;
  const newInquiries = quotations.filter((q) => q.status === "new").length;
  const thisWeek = quotations.filter((q) => now - new Date(q.created_at).getTime() <= 7 * DAY_MS).length;
  const thisMonth = quotations.filter((q) => now - new Date(q.created_at).getTime() <= 30 * DAY_MS).length;
  const recentInquiries = [...quotations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // ── Product Interest (real, from quotation product_name links) ───────
  const interestCounts = new Map<string, number>();
  for (const q of quotations) {
    if (!q.product_name) continue;
    interestCounts.set(q.product_name, (interestCounts.get(q.product_name) ?? 0) + 1);
  }
  const totalLinkedInquiries = [...interestCounts.values()].reduce((a, b) => a + b, 0);
  const productInterest = [...interestCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalLinkedInquiries) * 100) }));

  // ── Recent Content (real, sorted by real timestamps where available) ─
  const recentProducts = [...products].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
  const recentArticles = [...articles].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
  const recentGallery = [...galleryItems].slice(0, 5);

  const manageLinks = [
    { label: "Home", icon: HomeIcon, href: "/admin/homepage" },
    { label: "About Company", icon: AboutCompanyIcon, href: "/admin/about-company" },
    { label: "Our Products", icon: ProductsIcon, href: "/admin/produk" },
    { label: "Facilities", icon: FacilitiesIcon, href: "/admin/about-company/facilities" },
    { label: "Gallery", icon: GalleryIcon, href: "/admin/galeri" },
    { label: "News", icon: NewsIcon, href: "/admin/artikel" },
    { label: "Contact", icon: ContactIcon, href: "/admin/pengaturan/kontak" },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-body text-neutral-600">
            Welcome back, Admin. Manage and monitor your PPN website content from one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-small font-medium text-primary-700">
            <span className="h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />
            Website Online
          </span>
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}
            target="_blank"
            rel="noreferrer"
            className="rounded-button border border-neutral-200 bg-white px-4 py-2 text-small font-medium text-neutral-700 hover:border-primary-300"
          >
            Preview Website ↗
          </a>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mt-4">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Quick Actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickAction href="/admin/produk/baru" label="+ Add Product" />
          <QuickAction href="/admin/galeri/media" label="+ Upload Gallery" />
          <QuickAction href="/admin/artikel/baru" label="+ Add News" />
          <QuickAction href="/admin/about-company/facilities" label="Manage Facilities" />
          <QuickAction href="/admin/about-company/legal_certificate" label="+ Add Certificate" />
        </div>
      </div>

      {/* ── Website Overview ── */}
      <div className="mt-8">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Website Overview</p>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card hoverable className="h-full">
                <div className="flex items-center gap-2 text-neutral-400">
                  <card.icon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">{card.label}</span>
                </div>
                <p className="mt-2 text-h1 font-heading font-bold text-neutral-900">{card.value}</p>
                <p className="mt-1 text-small text-neutral-500">{card.sub}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Content Health + Alerts ── */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Content Health</p>
          <div className="mt-4 flex flex-col gap-4">
            {healthBars.map((bar) => (
              <Link key={bar.label} href={bar.href} className="group">
                <div className="flex items-center justify-between text-small">
                  <span className="text-neutral-700 group-hover:text-primary-700">{bar.label}</span>
                  <span className="font-medium text-neutral-500">{bar.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-500", bar.pct >= 90 ? "bg-primary-500" : bar.pct >= 60 ? "bg-accent-500" : "bg-amber-500")}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Content Needs Attention</p>
          <div className="mt-4 flex flex-col gap-3">
            {alerts.length === 0 ? (
              <p className="text-body text-primary-700">✓ Everything looks good.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.text} className="flex items-center justify-between gap-3 rounded-field border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <p className="text-small text-amber-800">⚠ {alert.text}</p>
                  <Link href={alert.href} className="shrink-0 text-small font-medium text-amber-800 underline">
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Language Coverage ── */}
      <div className="mt-4">
        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
            Language Coverage — Products
          </p>
          <p className="mt-1 text-small text-neutral-500">
            Translation completeness per language, averaged across all products.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center justify-between rounded-field border border-neutral-100 px-3 py-2.5">
              <span className="flex items-center gap-2 text-small text-neutral-700">
                <span aria-hidden="true">{LOCALE_LABELS.en.flag}</span> {LOCALE_LABELS.en.name}
              </span>
              <span className="text-small font-medium text-primary-700">100%</span>
            </div>
            {localeCoverage.map(({ locale, pct }) => (
              <div key={locale} className="flex items-center justify-between rounded-field border border-neutral-100 px-3 py-2.5">
                <span className="flex items-center gap-2 text-small text-neutral-700">
                  <span aria-hidden="true">{LOCALE_LABELS[locale].flag}</span> {LOCALE_LABELS[locale].name}
                </span>
                <span className={cn("text-small font-medium", pct >= 90 ? "text-primary-700" : "text-amber-700")}>{pct}%</span>
              </div>
            ))}
          </div>
          {overallTranslationCoverage < 90 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-small text-amber-700">⚠ Some products have missing translations</p>
              <Link href="/admin/produk" className="text-small font-medium text-primary-700 underline">
                Review Translations
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* ── Buyer Inquiries + Product Interest ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Buyer Inquiries</p>
            <Link href="/admin/kontak" className="text-small font-medium text-primary-700 underline">
              View All Inquiries
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-h2 font-heading font-bold text-neutral-900">{newInquiries}</p>
              <p className="text-small text-neutral-500">New</p>
            </div>
            <div>
              <p className="text-h2 font-heading font-bold text-neutral-900">{thisWeek}</p>
              <p className="text-small text-neutral-500">This Week</p>
            </div>
            <div>
              <p className="text-h2 font-heading font-bold text-neutral-900">{thisMonth}</p>
              <p className="text-small text-neutral-500">This Month</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {recentInquiries.length === 0 ? (
              <div className="rounded-field border border-dashed border-neutral-200 p-6 text-center">
                <p className="text-body font-medium text-neutral-700">No New Inquiries</p>
                <p className="mt-1 text-small text-neutral-500">You don&rsquo;t have any buyer inquiries yet.</p>
              </div>
            ) : (
              recentInquiries.map((q) => (
                <Link
                  key={q.id}
                  href="/admin/kontak"
                  className="flex items-center justify-between gap-3 rounded-field border border-neutral-100 px-3 py-2.5 hover:border-primary-200"
                >
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium text-neutral-900">
                      {q.name} · {q.company}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {q.country} {q.product_name ? `· ${q.product_name}` : ""} · {timeAgo(q.created_at)}
                    </p>
                  </div>
                  <Badge variant={q.status === "new" ? "primary" : "neutral"}>{q.status}</Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Product Interest</p>
          <p className="mt-1 text-small text-neutral-500">Based on which product each inquiry was about.</p>
          <div className="mt-4 flex flex-col gap-3">
            {productInterest.length === 0 ? (
              <p className="text-body text-neutral-500">Not enough inquiry data yet.</p>
            ) : (
              productInterest.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-small">
                    <span className="text-neutral-700">{item.name}</span>
                    <span className="font-medium text-neutral-500">{item.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-primary-500 transition-[width] duration-500" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Recent Content ── */}
      <div className="mt-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Recent Content</p>
            <div className="flex gap-1">
              {(["products", "news", "gallery"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onContentTabChange(tab)}
                  className={cn(
                    "rounded-button px-3 py-1.5 text-small font-medium capitalize transition-colors",
                    contentTab === tab ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {contentTab === "products" &&
              (recentProducts.length === 0 ? (
                <p className="text-body text-neutral-500">No products yet.</p>
              ) : (
                recentProducts.map((p) => (
                  <Link key={p.id} href={`/admin/produk/${p.id}`} className="flex items-center justify-between rounded-field border border-neutral-100 px-3 py-2.5 hover:border-primary-200">
                    <p className="text-small font-medium text-neutral-900">{p.name}</p>
                    <p className="text-[11px] text-neutral-500">Updated {timeAgo(p.updated_at)}</p>
                  </Link>
                ))
              ))}
            {contentTab === "news" &&
              (recentArticles.length === 0 ? (
                <p className="text-body text-neutral-500">No articles yet.</p>
              ) : (
                recentArticles.map((a) => (
                  <Link key={a.id} href={`/admin/artikel/${a.id}`} className="flex items-center justify-between rounded-field border border-neutral-100 px-3 py-2.5 hover:border-primary-200">
                    <p className="min-w-0 truncate text-small font-medium text-neutral-900">{a.title}</p>
                    <p className="shrink-0 text-[11px] text-neutral-500">Updated {timeAgo(a.updated_at)}</p>
                  </Link>
                ))
              ))}
            {contentTab === "gallery" &&
              (recentGallery.length === 0 ? (
                <p className="text-body text-neutral-500">No gallery items yet.</p>
              ) : (
                recentGallery.map((g) => (
                  <Link key={g.id} href="/admin/galeri/media" className="flex items-center justify-between rounded-field border border-neutral-100 px-3 py-2.5 hover:border-primary-200">
                    <p className="min-w-0 truncate text-small font-medium text-neutral-900">{g.title || g.category.name}</p>
                    <Badge variant={g.active ? "primary" : "neutral"}>{g.active ? "Active" : "Inactive"}</Badge>
                  </Link>
                ))
              ))}
          </div>
        </Card>
      </div>

      {/* ── Manage Website ── */}
      <div className="mt-8 pb-10">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Manage Website</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {manageLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              <Card hoverable className="flex flex-col items-center gap-2 py-5 text-center">
                <link.icon className="h-6 w-6 text-primary-700" />
                <span className="text-small font-medium text-neutral-900">{link.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-button bg-primary-500 px-4 py-2 text-small font-medium text-neutral-900 transition-colors hover:bg-primary-600"
    >
      {label}
    </Link>
  );
}
