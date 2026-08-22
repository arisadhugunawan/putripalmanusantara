"use client";

import type { ArticleCategory } from "@ppn/shared-types";
import { Badge, Button, Card, cn, Input, Label } from "@ppn/ui-components";
import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

// Brief §12 — categories manageable from Admin, mirrors LegalDocumentCategory's pattern.
export default function ArticleCategoriesPage() {
  const fetchCategories = useCallback(
    () => adminApi.get<ArticleCategory[]>("/admin/articles/categories"),
    [],
  );
  const { data: categories, status, reload, retry } = useAdminResource(fetchCategories);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/articles/categories", {
        name: newName,
        order: categories?.length ?? 0,
        active: true,
      });
      setNewName("");
      await reload();
      showToast("Kategori ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah kategori.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/articles/categories/${id}`, patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Perubahan gagal disimpan.", "error");
      await reload();
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/articles/categories/${id}`);
      await reload();
      showToast("Kategori dihapus. Artikelnya tetap ada, hanya tanpa kategori.");
    } catch {
      showToast("Gagal menghapus kategori. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!categories) return;
    if (to < 0 || to >= categories.length) return;
    const next = arrayMove(categories, from, to);
    try {
      await Promise.all(
        next
          .map((category, index) =>
            category.order === index
              ? null
              : adminApi.put(`/admin/articles/categories/${category.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan kategori.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Kategori Artikel</h1>
        <Link href="/admin/artikel" className="text-body text-primary-700 underline">
          ← Kembali ke Artikel
        </Link>
      </div>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Kategori</h2>
        <p className="mt-1 text-small text-neutral-600">
          Kategori yang bisa dipilih tiap artikel dan dipakai sebagai filter di Admin. Seret untuk mengubah
          urutan, atau gunakan Naik/Turun.
        </p>

        {status === "error" && <AdminLoadError message="Gagal memuat kategori." onRetry={() => void retry()} />}
        {status === "loading" && (
          <div className="mt-4">
            <SkeletonCard rows={2} />
          </div>
        )}

        {status === "ready" && categories && (
          <div className="mt-4 flex flex-col gap-2">
            {categories.length === 0 && (
              <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
                <p className="text-body text-neutral-600">Belum ada kategori.</p>
              </div>
            )}
            {categories.map((category, index) => {
              const rowProps = getRowProps(index);
              return (
                <div
                  key={category.id}
                  {...rowProps}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                    rowProps.className,
                  )}
                >
                  <span {...getHandleProps(index)}>
                    <DragHandle />
                  </span>
                  <Input
                    className="max-w-xs"
                    defaultValue={category.name}
                    onBlur={(e) => void handleUpdate(category.id, { name: e.target.value })}
                  />
                  <Badge variant="neutral">{category.slug}</Badge>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={category.active}
                      onChange={(e) => void handleUpdate(category.id, { active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Aktif
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index - 1)}
                    disabled={index === 0}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === categories.length - 1}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(category.id)}
                    className="ml-auto text-small text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
          <div className="min-w-[16rem] flex-1">
            <Label htmlFor="new-category-name">+ Tambah Kategori</Label>
            <Input
              id="new-category-name"
              value={newName}
              placeholder="mis. Coconut Export"
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button type="submit">Tambah</Button>
          {error && <p className="w-full text-small text-red-600">{error}</p>}
        </form>
      </Card>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus kategori ini?"
          message="Artikel yang memakai kategori ini tidak ikut terhapus — artikelnya tetap ada dan hanya kehilangan kategorinya."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
