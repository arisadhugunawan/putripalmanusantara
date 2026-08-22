"use client";

import { Badge, Button, cn, EmptyState, Pagination, Select } from "@ppn/ui-components";
import type { ArticleCategory, ArticleDetail, PaginationMeta } from "@ppn/shared-types";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { InstagramImportModal } from "@/components/admin/InstagramImportModal";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

type Tab = "all" | "website" | "instagram" | "featured" | "draft" | "published";
type SortOption = "newest" | "oldest" | "featured";

const LIMIT = 20;

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "featured", label: "Featured First" },
];

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "website", label: "Website Articles" },
  { key: "instagram", label: "Instagram Content" },
  { key: "featured", label: "Featured" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
];

/** Maps a tab to the query params it sends the (now server-side) list endpoint — the tabs are
 * still mutually exclusive single-select, exactly like before Phase 5C, just resolved on the
 * server instead of filtered client-side out of a full in-memory list. */
function tabParams(tab: Tab): { status?: string; featured?: string; content_type?: string } {
  switch (tab) {
    case "website":
      return { content_type: "website" };
    case "instagram":
      return { content_type: "instagram" };
    case "featured":
      return { featured: "true" };
    case "draft":
      return { status: "draft" };
    case "published":
      return { status: "published" };
    default:
      return {};
  }
}

function sortParam(sort: SortOption): string {
  if (sort === "oldest") return "published_at";
  if (sort === "featured") return "-featured";
  return "-published_at";
}

function contentTypeBadge(article: ArticleDetail) {
  if (article.content_source === "both") return { label: "Instagram + Website", variant: "primary" as const };
  if (article.content_source === "instagram") return { label: "Instagram Only", variant: "accent" as const };
  return { label: "Website Only", variant: "neutral" as const };
}

export default function AdminArticlesPage() {
  const fetchCategories = useCallback(() => adminApi.get<ArticleCategory[]>("/admin/articles/categories"), []);
  const { data: categories } = useAdminResource(fetchCategories);

  const [articles, setArticles] = useState<ArticleDetail[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), sort: sortParam(sort) });
      if (search.trim()) params.set("q", search.trim());
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      for (const [key, value] of Object.entries(tabParams(tab))) {
        if (value) params.set(key, value);
      }
      const result = await adminApi.getPaginated<ArticleDetail[]>(`/admin/articles?${params}`);
      setArticles(result.data);
      setMeta(result.meta);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [page, search, categoryFilter, sort, tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-filter-change; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  // A tab/search/filter change always jumps back to page 1 — a stale page number past the new
  // (smaller) result set would otherwise show an empty grid with no way back.
  const [prevFilters, setPrevFilters] = useState({ tab, search, categoryFilter, sort });
  if (
    prevFilters.tab !== tab ||
    prevFilters.search !== search ||
    prevFilters.categoryFilter !== categoryFilter ||
    prevFilters.sort !== sort
  ) {
    setPrevFilters({ tab, search, categoryFilter, sort });
    if (page !== 1) setPage(1);
  }

  const hasActiveFilters = Boolean(search.trim() || categoryFilter !== "all" || tab !== "all");

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/articles/${id}`);
      await load();
      showToast("Content deleted successfully.");
      setDeleteTarget(null);
    } catch {
      showToast("Unable to delete content.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    try {
      await adminApi.post(`/admin/articles/${id}/duplicate`, {});
      await load();
      showToast("Content duplicated as a new draft.");
    } catch {
      showToast("Unable to duplicate content.", "error");
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h2 text-neutral-900">Insight & Articles</h1>
          <p className="mt-1 text-small text-neutral-600">
            Kelola artikel website — termasuk konten yang bersumber dari Instagram.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/artikel/kategori" className="text-body text-primary-700 underline">
            Kelola Kategori
          </Link>
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            + Import from Instagram
          </Button>
          <Link href="/admin/artikel/baru">
            <Button>+ Add Content</Button>
          </Link>
        </div>
      </div>

      {showImportModal && <InstagramImportModal onClose={() => setShowImportModal(false)} />}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-t-field px-4 py-2 text-small font-medium",
              tab === t.key ? "border-b-2 border-primary-600 text-primary-700" : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul, kategori, caption, atau tag..."
          className="min-w-[16rem] flex-1 rounded-field border border-neutral-300 px-3 py-2 text-body"
        />
        <Select
          aria-label="Kategori"
          className="w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: "all", label: "Semua Kategori" },
            ...(categories?.map((category) => ({ value: category.slug, label: category.name })) ?? []),
          ]}
        />
        <Select
          aria-label="Sort"
          className="w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          options={SORT_OPTIONS.map((option) => ({ value: option.key, label: `Sort: ${option.label}` }))}
        />
      </div>

      {meta && (
        <p className="mt-4 text-small text-neutral-500">
          {meta.total} content{hasActiveFilters ? " found" : ""}
        </p>
      )}

      {status === "error" && <AdminLoadError message="Gagal memuat artikel." onRetry={() => void load()} />}
      {status === "loading" && (
        <div className="mt-4">
          <SkeletonListRows rows={4} />
        </div>
      )}

      {status === "ready" && articles && (
        <>
          {articles.length === 0 ? (
            <EmptyState
              className="mt-4"
              title={
                search.trim()
                  ? `No content matches "${search.trim()}".`
                  : hasActiveFilters
                    ? "No content matches this filter."
                    : "Belum ada konten."
              }
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const badge = contentTypeBadge(article);
                return (
                  <div key={article.id} className="flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card">
                    <div className="relative aspect-video bg-neutral-100">
                      {article.cover_image ? (
                        <Image
                          src={article.cover_image.file_url}
                          alt={article.cover_image.alt_text}
                          fill
                          sizes="400px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-small text-neutral-400">No image</div>
                      )}
                      {article.featured && (
                        <span className="absolute right-2 top-2 rounded-full bg-secondary-500 px-2 py-1 text-small font-semibold text-neutral-900">
                          ★ Featured
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <Badge variant={badge.variant} className="w-fit">
                        {badge.label}
                      </Badge>
                      <h3 className="text-h3 text-neutral-900">{article.title}</h3>
                      {article.category && <p className="text-small text-neutral-600">{article.category.name}</p>}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-small text-neutral-600">
                        <span>
                          Website:{" "}
                          <strong className={article.status === "published" ? "text-primary-700" : "text-neutral-700"}>
                            {article.status === "published" ? "Published" : "Draft"}
                          </strong>
                        </span>
                        <span>
                          Instagram: <strong className="text-neutral-700">{article.instagram_url ? "Posted" : "No link"}</strong>
                        </span>
                      </div>
                      <p className="text-small text-neutral-500">
                        {new Date(article.published_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-3 border-t border-neutral-100 pt-3 text-small">
                        <a
                          href={`/admin/preview/artikel/${article.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-700 underline"
                        >
                          Preview
                        </a>
                        <Link href={`/admin/artikel/${article.id}`} className="text-primary-700 underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDuplicate(article.id)}
                          disabled={duplicatingId === article.id}
                          className="text-neutral-600 underline disabled:opacity-50"
                        >
                          {duplicatingId === article.id ? "Duplicating..." : "Duplicate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: article.id, title: article.title })}
                          className="ml-auto text-red-600 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {meta && (
            <Pagination
              page={page}
              totalPages={meta.total_pages}
              onPageChange={setPage}
              summary={`Showing ${(page - 1) * meta.limit + 1}–${Math.min(page * meta.limit, meta.total)} of ${meta.total}`}
            />
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this content?"
          message="This action cannot be undone."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTarget.id);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
