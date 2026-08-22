"use client";

import { Badge, Button, cn } from "@ppn/ui-components";
import type { ArticleCategory, ArticleDetail } from "@ppn/shared-types";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { InstagramImportModal } from "@/components/admin/InstagramImportModal";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

type Tab = "all" | "website" | "instagram" | "featured" | "draft" | "published";
type SortOption = "newest" | "oldest" | "featured";

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

function contentTypeBadge(article: ArticleDetail) {
  if (article.content_source === "both") return { label: "Instagram + Website", variant: "primary" as const };
  if (article.content_source === "instagram") return { label: "Instagram Only", variant: "accent" as const };
  return { label: "Website Only", variant: "neutral" as const };
}

export default function AdminArticlesPage() {
  const fetchArticles = useCallback(() => adminApi.get<ArticleDetail[]>("/admin/articles"), []);
  const fetchCategories = useCallback(() => adminApi.get<ArticleCategory[]>("/admin/articles/categories"), []);
  const { data: articles, status, reload, retry } = useAdminResource(fetchArticles);
  const { data: categories } = useAdminResource(fetchCategories);

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    if (!articles) return null;
    const query = search.trim().toLowerCase();
    const result = articles.filter((article) => {
      if (tab === "website" && article.content_source === "instagram") return false;
      if (tab === "instagram" && article.content_source === "website") return false;
      if (tab === "featured" && !article.featured) return false;
      if (tab === "draft" && article.status !== "draft") return false;
      if (tab === "published" && article.status !== "published") return false;
      if (categoryFilter !== "all" && article.category?.slug !== categoryFilter) return false;
      if (
        query &&
        !`${article.title} ${article.category?.name ?? ""} ${article.instagram_caption ?? ""} ${article.tags.join(" ")}`
          .toLowerCase()
          .includes(query)
      )
        return false;
      return true;
    });
    const sorted = [...result];
    if (sort === "oldest") {
      sorted.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
    } else if (sort === "featured") {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    } else {
      sorted.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }
    return sorted;
  }, [articles, tab, search, categoryFilter, sort]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/articles/${id}`);
      await reload();
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
      await reload();
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-field border border-neutral-300 px-3 py-2 text-body"
        >
          <option value="all">Semua Kategori</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          aria-label="Sort"
          className="rounded-field border border-neutral-300 px-3 py-2 text-body"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && <AdminLoadError message="Gagal memuat artikel." onRetry={() => void retry()} />}
      {status === "loading" && (
        <div className="mt-6">
          <SkeletonListRows rows={4} />
        </div>
      )}

      {status === "ready" && filtered && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <p className="col-span-full p-6 text-center text-body text-neutral-600">
              {articles?.length === 0 ? "Belum ada konten." : "Tidak ada konten yang cocok dengan pencarian/filter ini."}
            </p>
          )}
          {filtered.map((article) => {
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
