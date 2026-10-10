"use client";

import { Badge, Button, EmptyState, Pagination, Select, Table } from "@ppn/ui-components";
import type { PaginationMeta, ProductDetail } from "@ppn/shared-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "draft", label: "Draf" },
  { value: "published", label: "Diterbitkan" },
];

const FEATURED_OPTIONS = [
  { value: "", label: "Semua Produk" },
  { value: "true", label: "Unggulan" },
  { value: "false", label: "Bukan Unggulan" },
];

// FR-CMS-03 — daftar produk (termasuk draft). Paginated/searchable/filterable server-side
// (Phase 5C) — `GET /admin/products` only returns this page's slice once `page` is passed;
// every other admin surface (Dashboard, Homepage pickers) still calls it without `page` and
// keeps getting the full unpaginated list, so this change is scoped to this page alone.
export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (featuredFilter) params.set("featured", featuredFilter);
      const result = await adminApi.getPaginated<ProductDetail[]>(`/admin/products?${params}`);
      setProducts(result.data);
      setMeta(result.meta);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [page, search, statusFilter, featuredFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-filter-change; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  // A search/filter change always jumps back to page 1 — a stale page number past the new
  // (smaller) result set would otherwise show an empty table with no way back.
  const [prevFilters, setPrevFilters] = useState({ search, statusFilter, featuredFilter });
  if (
    prevFilters.search !== search ||
    prevFilters.statusFilter !== statusFilter ||
    prevFilters.featuredFilter !== featuredFilter
  ) {
    setPrevFilters({ search, statusFilter, featuredFilter });
    if (page !== 1) setPage(1);
  }

  const hasActiveFilters = Boolean(search.trim() || statusFilter || featuredFilter);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/products/${id}`);
      await load();
      showToast("Produk berhasil dihapus.");
      setDeleteTarget(null);
    } catch {
      showToast("Gagal menghapus produk. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Produk</h1>
        <Link href="/admin/produk/baru">
          <Button>Tambah Produk</Button>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau kategori produk..."
          className="min-w-[16rem] flex-1 rounded-field border border-neutral-300 px-4 py-2.5 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <Select
          aria-label="Filter status"
          className="w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          aria-label="Filter unggulan"
          className="w-auto"
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          options={FEATURED_OPTIONS}
        />
      </div>

      {status === "error" && <AdminLoadError message="Gagal memuat produk." onRetry={() => void load()} />}

      {status === "loading" && (
        <div className="mt-6">
          <SkeletonListRows rows={5} />
        </div>
      )}

      {status === "ready" && products && (
        <>
          {meta && (
            <p className="mt-4 text-small text-neutral-500">
              {meta.total} produk{hasActiveFilters ? " ditemukan" : ""}
            </p>
          )}

          {products.length === 0 ? (
            <EmptyState
              className="mt-4"
              title={
                search.trim()
                  ? `Tidak ada produk yang cocok dengan "${search.trim()}".`
                  : hasActiveFilters
                    ? "Tidak ada produk yang cocok dengan filter ini."
                    : "Belum ada produk."
              }
              description={hasActiveFilters ? "Coba ubah kata kunci pencarian atau filter." : undefined}
            />
          ) : (
            <div className="mt-4">
              <Table>
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-small text-neutral-600">
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Unggulan</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-neutral-900">{product.name}</td>
                      <td className="px-4 py-3 text-neutral-600">{product.category}</td>
                      <td className="px-4 py-3">
                        <Badge variant={product.status === "published" ? "primary" : "neutral"}>
                          {product.status === "published" ? "Diterbitkan" : "Draf"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{product.is_featured ? "Ya" : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link
                            href={`/admin/produk/${product.id}`}
                            className="text-body text-primary-700 underline underline-offset-4"
                          >
                            Ubah
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                            className="text-body text-red-600 underline underline-offset-4"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {meta && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={meta.total_pages}
              onPageChange={setPage}
              summary={
                meta.total === 0
                  ? undefined
                  : `Showing ${(page - 1) * meta.limit + 1}–${Math.min(page * meta.limit, meta.total)} of ${meta.total} products`
              }
            />
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Hapus produk "${deleteTarget.name}"?`}
          message="Tindakan ini tidak dapat dibatalkan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTarget.id);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
