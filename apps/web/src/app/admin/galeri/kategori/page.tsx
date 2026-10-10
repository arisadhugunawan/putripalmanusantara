"use client";

import { Badge, Button, Card, cn, Input, Label } from "@ppn/ui-components";
import type { GalleryCategory, Locale } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const RESERVED_SLUGS = new Set(["products", "team"]);

// Gallery categories — "products" and "team" are reserved/virtual (render live data from the
// Products/Team modules instead of their own uploaded items), so their slug can't be edited
// but everything else (name, order, active, translations) works the same as any other category.
export default function AdminGalleryCategoriesPage() {
  const fetchCategories = useCallback(
    () => adminApi.get<GalleryCategory[]>("/admin/gallery/categories"),
    [],
  );
  const { data: categories, status, reload, retry } = useAdminResource(fetchCategories);

  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newName.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/gallery/categories", {
        name: newName,
        order: categories?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewName("");
      await reload();
      showToast("Kategori berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah kategori.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>, requiredLabel?: string) {
    if (requiredLabel) {
      const value = Object.values(patch)[0];
      if (typeof value === "string" && !value.trim()) {
        showToast(`${requiredLabel} wajib diisi.`, "error");
        await reload();
        return;
      }
    }
    try {
      await adminApi.put(`/admin/gallery/categories/${id}`, patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Perubahan tidak dapat disimpan.", "error");
      await reload();
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    try {
      await adminApi.delete(`/admin/gallery/categories/${id}`);
      setDeleteTargetId(null);
      setDeleteError(null);
      await reload();
      showToast("Kategori berhasil dihapus.");
    } catch (err) {
      setDeleteError(
        err instanceof ApiRequestError ? err.message : "Gagal menghapus kategori. Silakan coba lagi.",
      );
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
              : adminApi.put(`/admin/gallery/categories/${category.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Gagal memuat kategori galeri." onRetry={() => void retry()} />;

  if (status === "loading" || !categories) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={4} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Kategori Galeri</h1>
      <p className="mt-1 text-body text-neutral-600">
        Kelola kategori untuk halaman Galeri publik — urutan di sini menentukan urutan panel
        &ldquo;journey&rdquo; dan pill filter. Nonaktifkan kategori untuk menyembunyikannya tanpa
        menghapus isinya.
      </p>

      <Card className="mt-4">
        <div className="flex flex-col gap-3">
          {categories.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
              <p className="text-body text-neutral-600">Belum ada kategori.</p>
            </div>
          )}
          {categories.map((category, index) => {
            const rowProps = getRowProps(index);
            const isReserved = RESERVED_SLUGS.has(category.slug);
            return (
              <div
                key={category.id}
                {...rowProps}
                className={cn(
                  "flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                  rowProps.className,
                )}
              >
                <span {...getHandleProps(index)} className="mt-7">
                  <DragHandle />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-small">Nama *</Label>
                    {isReserved && <Badge variant="neutral">Virtual — data dari modul lain</Badge>}
                  </div>
                  <Input
                    defaultValue={category.name}
                    onBlur={(e) => void handleUpdate(category.id, { name: e.target.value }, "Nama")}
                  />
                  <p className="mt-1 text-small text-neutral-500">Slug: {category.slug}</p>
                  <GenerateTranslationsPanel
                    statusUrl={`/admin/gallery/categories/${category.id}/translation-status`}
                    generateUrl={`/admin/gallery/categories/${category.id}/translations/generate`}
                    onGenerated={() => void reload()}
                  />
                  <RowTranslationsDisclosure
                    key={`${category.id}-${JSON.stringify(category.translations ?? {})}`}
                    translations={category.translations}
                    fields={[{ key: "name", label: "Nama" }]}
                    onSave={(locale: Locale, key, value) =>
                      void handleUpdate(category.id, {
                        translations: {
                          ...(category.translations ?? {}),
                          [locale]: { ...(category.translations?.[locale] ?? {}), [key]: value },
                        },
                      })
                    }
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                    <label className="flex items-center gap-2 text-neutral-600">
                      <input
                        type="checkbox"
                        checked={category.active}
                        onChange={(e) => void handleUpdate(category.id, { active: e.target.checked })}
                        className="h-4 w-4"
                      />
                      Aktif
                    </label>
                    <span className="text-neutral-500">Urutan {String(index + 1).padStart(2, "0")}</span>
                    <button
                      type="button"
                      onClick={() => void handleReorder(index, index - 1)}
                      disabled={index === 0}
                      className="text-neutral-600 underline disabled:opacity-30"
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReorder(index, index + 1)}
                      disabled={index === categories.length - 1}
                      className="text-neutral-600 underline disabled:opacity-30"
                    >
                      Turun
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTargetId(category.id);
                      }}
                      className="ml-auto text-red-600 underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
          <p className="text-small font-medium text-neutral-900">+ Tambah Kategori</p>
          <Input placeholder="Nama, mis. Sorting" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          {error && <p className="text-small text-red-600">{error}</p>}
          <Button type="submit" className="w-fit">
            Tambah Kategori
          </Button>
        </form>
      </Card>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus kategori ini?"
          message={
            deleteError ??
            "Kategori akan dihapus dan tidak akan tampil di halaman publik. Kategori yang masih memiliki item galeri tidak dapat dihapus."
          }
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            setDeleteTargetId(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
