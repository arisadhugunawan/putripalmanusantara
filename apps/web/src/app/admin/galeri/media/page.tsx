"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { GalleryCategory, GalleryItem, GalleryMediaType, Media } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const MEDIA_TYPE_LABELS: Record<GalleryMediaType, string> = {
  image: "Gambar",
  video: "Video",
  youtube: "YouTube",
  tiktok: "TikTok",
};

interface PendingFile {
  id: string;
  file: File;
  title: string;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function AdminGalleryMediaPage() {
  const fetchItems = useCallback(() => adminApi.get<GalleryItem[]>("/admin/gallery"), []);
  const fetchCategories = useCallback(
    () => adminApi.get<GalleryCategory[]>("/admin/gallery/categories"),
    [],
  );
  const { data: items, status: itemsStatus, reload: reloadItems } = useAdminResource(fetchItems);
  const { data: categories, status: categoriesStatus, reload: reloadCategories } = useAdminResource(fetchCategories);
  const { showToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await Promise.all([reloadItems(), reloadCategories()]);
  }, [reloadItems, reloadCategories]);

  const filteredItems = useMemo(() => {
    if (!items) return null;
    if (categoryFilter === "all") return items;
    return items.filter((item) => item.category.id === categoryFilter);
  }, [items, categoryFilter]);

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/gallery/${id}`, patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Perubahan tidak dapat disimpan.", "error");
      await reload();
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/gallery/${id}`);
      await reload();
      showToast("Item galeri berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus item galeri. Silakan coba lagi.", "error");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!items || categoryFilter !== "all") return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/gallery/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/gallery/${b.id}`, { order: a.order }),
      ]);
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  if (itemsStatus === "error" || categoriesStatus === "error") {
    return <AdminLoadError message="Gagal memuat pustaka media." onRetry={() => void reload()} />;
  }

  if (itemsStatus === "loading" || categoriesStatus === "loading" || !items || !categories || !filteredItems) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={4} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Pustaka Media</h1>
      <p className="mt-1 text-body text-neutral-600">
        Unggah foto/video, atau tambahkan tautan YouTube/TikTok. Item baru langsung tampil di
        halaman Galeri publik.
      </p>

      <AddMediaPanel categories={categories} onAdded={() => void reload()} />

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 text-neutral-900">Semua Item ({filteredItems.length})</h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="category-filter" className="text-small">
              Filter Kategori
            </Label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {categoryFilter !== "all" && (
          <p className="mt-2 text-small text-neutral-500">
            Urutan hanya dapat diubah saat filter kategori = &ldquo;Semua Kategori&rdquo;.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {filteredItems.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-body text-neutral-600">Belum ada media di kategori ini.</p>
            </div>
          )}
          {filteredItems.map((item) => {
            const globalIndex = items.findIndex((i) => i.id === item.id);
            return (
              <GalleryItemRow
                key={item.id}
                item={item}
                categories={categories}
                canReorder={categoryFilter === "all"}
                isFirst={globalIndex === 0}
                isLast={globalIndex === items.length - 1}
                onUpdate={(patch) => void handleUpdate(item.id, patch)}
                onMove={(direction) => void handleMove(globalIndex, direction)}
                onDelete={() => setDeleteTargetId(item.id)}
              />
            );
          })}
        </div>
      </Card>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus item galeri ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}

function AddMediaPanel({
  categories,
  onAdded,
}: {
  categories: GalleryCategory[];
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkType, setLinkType] = useState<"youtube" | "tiktok">("youtube");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  function handleFilesSelected() {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;
    const next: PendingFile[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      title: file.name.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " ").trim(),
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));
    setPending((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePending(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleUploadAll() {
    if (!categoryId || pending.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const item of pending) {
      if (item.status === "done") {
        successCount++;
        continue;
      }
      setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p)));
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("alt_text", item.title || "Foto galeri PPN");
        const media = await adminApi.post<Media>("/admin/media", formData);
        await adminApi.post("/admin/gallery", {
          media_type: item.file.type.startsWith("video/") ? "video" : "image",
          media_id: media.id,
          category_id: categoryId,
          title: item.title || undefined,
          alt_text: item.title || undefined,
          featured: false,
          active: true,
        });
        successCount++;
        setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "done" } : p)));
      } catch (err) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "error", error: err instanceof ApiRequestError ? err.message : "Gagal mengunggah." }
              : p,
          ),
        );
      }
    }
    setUploading(false);
    if (successCount > 0) onAdded();
    setPending((prev) => prev.filter((p) => p.status !== "done"));
  }

  async function handleAddLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLinkError(null);
    if (!categoryId) {
      setLinkError("Pilih kategori terlebih dahulu.");
      return;
    }
    if (!linkUrl.trim()) {
      setLinkError("URL wajib diisi.");
      return;
    }
    setLinkSubmitting(true);
    try {
      await adminApi.post("/admin/gallery", {
        media_type: linkType,
        external_url: linkUrl.trim(),
        category_id: categoryId,
        title: linkTitle || undefined,
        featured: false,
        active: true,
      });
      setLinkUrl("");
      setLinkTitle("");
      onAdded();
    } catch (err) {
      setLinkError(err instanceof ApiRequestError ? err.message : "Gagal menambah tautan video.");
    } finally {
      setLinkSubmitting(false);
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">+ Tambah Media</h2>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "rounded-field px-3 py-1.5 text-small font-medium",
            mode === "upload" ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600",
          )}
        >
          Unggah File
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "rounded-field px-3 py-1.5 text-small font-medium",
            mode === "link" ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600",
          )}
        >
          Tambah Tautan Video
        </button>
      </div>

      <div className="mt-4">
        <Label htmlFor="add-media-category" className="text-small">
          Kategori
        </Label>
        <select
          id="add-media-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full max-w-xs rounded-field border border-neutral-300 px-3 py-2 text-small"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {mode === "upload" ? (
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm"
            onChange={handleFilesSelected}
            className="text-small"
          />
          <p className="mt-1 text-small text-neutral-500">
            Pilih beberapa file sekaligus. Rekomendasi foto: minimal 1200px pada sisi terpanjang.
          </p>

          {pending.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-field border border-neutral-200 p-2">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-field bg-neutral-100">
                    {p.file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL, next/image can't optimize blob sources
                      <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-small text-neutral-400">▶</div>
                    )}
                  </div>
                  <Input
                    value={p.title}
                    onChange={(e) =>
                      setPending((prev) => prev.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))
                    }
                    placeholder="Judul (opsional)"
                    disabled={p.status === "uploading" || p.status === "done"}
                    className="flex-1"
                  />
                  <span className="w-20 shrink-0 text-small text-neutral-500">
                    {p.status === "pending" && "Menunggu"}
                    {p.status === "uploading" && "Mengunggah…"}
                    {p.status === "done" && "✓ Selesai"}
                    {p.status === "error" && "Gagal"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(p.id)}
                    disabled={p.status === "uploading"}
                    className="text-small text-red-600 underline disabled:opacity-30"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {pending.some((p) => p.status === "error") && (
                <p className="text-small text-red-600">
                  Beberapa file gagal diunggah — file lain yang berhasil tetap tersimpan.
                </p>
              )}
              <Button type="button" onClick={() => void handleUploadAll()} disabled={uploading} className="w-fit">
                {uploading ? "Mengunggah…" : `Unggah ${pending.length} File`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => void handleAddLink(e)} className="mt-4 flex flex-col gap-3">
          <div>
            <Label className="text-small">Platform</Label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as "youtube" | "tiktok")}
              className="w-full max-w-xs rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <div>
            <Label className="text-small">URL Video</Label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={linkType === "youtube" ? "https://youtube.com/watch?v=..." : "https://tiktok.com/@ppn/video/..."}
            />
          </div>
          <div>
            <Label className="text-small">Judul (opsional)</Label>
            <Input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
          </div>
          {linkError && <p className="text-small text-red-600">{linkError}</p>}
          <Button type="submit" disabled={linkSubmitting} className="w-fit">
            {linkSubmitting ? "Menambahkan…" : "Tambah Video"}
          </Button>
        </form>
      )}
    </Card>
  );
}

function GalleryItemRow({
  item,
  categories,
  canReorder,
  isFirst,
  isLast,
  onUpdate,
  onMove,
  onDelete,
}: {
  item: GalleryItem;
  categories: GalleryCategory[];
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Record<string, unknown>) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-field border border-neutral-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-100">
          {item.media ? (
            <Image src={item.media.file_url} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-h3 text-neutral-400">▶</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{item.title || "(Tanpa judul)"}</p>
          <p className="text-small text-neutral-500">{item.category.name}</p>
        </div>
        <Badge variant="neutral">{MEDIA_TYPE_LABELS[item.media_type]}</Badge>
        {item.featured && <Badge variant="primary">Unggulan</Badge>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input type="checkbox" checked={item.active} onChange={(e) => onUpdate({ active: e.target.checked })} className="h-4 w-4" />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input type="checkbox" checked={item.featured} onChange={(e) => onUpdate({ featured: e.target.checked })} className="h-4 w-4" />
          Unggulan
        </label>
        {canReorder && (
          <>
            <button type="button" onClick={() => onMove(-1)} disabled={isFirst} className="text-small text-neutral-600 underline disabled:opacity-30">
              Naik
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={isLast} className="text-small text-neutral-600 underline disabled:opacity-30">
              Turun
            </button>
          </>
        )}
        <button type="button" onClick={onDelete} className="ml-auto text-small text-red-600 underline">
          Hapus
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-small">Judul</Label>
          <Input defaultValue={item.title ?? ""} onBlur={(e) => onUpdate({ title: e.target.value })} />
        </div>
        <div>
          <Label className="text-small">Kategori</Label>
          <select
            defaultValue={item.category.id}
            onChange={(e) => onUpdate({ category_id: e.target.value })}
            className="w-full rounded-field border border-neutral-300 px-3 py-2 text-small"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {item.media_type === "image" && (
          <div>
            <Label className="text-small">Teks Alternatif (Alt Text)</Label>
            <Input defaultValue={item.alt_text ?? ""} onBlur={(e) => onUpdate({ alt_text: e.target.value })} />
          </div>
        )}
        <div>
          <Label className="text-small">Lokasi (opsional)</Label>
          <Input defaultValue={item.location ?? ""} onBlur={(e) => onUpdate({ location: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-small">Deskripsi Singkat (opsional)</Label>
          <Textarea
            defaultValue={item.short_description ?? ""}
            rows={2}
            onBlur={(e) => onUpdate({ short_description: e.target.value })}
          />
        </div>
        {(item.media_type === "youtube" || item.media_type === "tiktok") && (
          <div className="sm:col-span-2">
            <Label className="text-small">URL Video</Label>
            <Input defaultValue={item.external_url ?? ""} onBlur={(e) => onUpdate({ external_url: e.target.value })} />
          </div>
        )}
      </div>
    </div>
  );
}
