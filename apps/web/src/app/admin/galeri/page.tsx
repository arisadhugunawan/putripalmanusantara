"use client";

import { Badge, Button, Card, Input, Label } from "@ppn/ui-components";
import type { GalleryCategory, GalleryItem, Media } from "@ppn/shared-types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";

const CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: "product", label: "Produk" },
  { value: "facility", label: "Fasilitas" },
  { value: "production", label: "Proses Produksi" },
  { value: "drone", label: "Drone" },
];

// FR-CMS-05 — upload, kategorikan, hapus media galeri.
export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [category, setCategory] = useState<GalleryCategory>("product");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<GalleryItem[]>("/admin/gallery");
    setItems(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !altText.trim()) {
      setValidationError("Pilih file dan isi teks alternatif.");
      return;
    }
    setValidationError(null);
    const result = await run(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", altText);
      const media = await adminApi.post<Media>("/admin/media", formData);
      await adminApi.post("/admin/gallery", {
        media_id: media.id,
        category,
        caption: caption || undefined,
      });
    });
    if (result.success) {
      setAltText("");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
      showToast("Media berhasil diunggah.");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/gallery/${id}`);
      await load();
      showToast("Item galeri berhasil dihapus.");
      setDeleteTargetId(null);
    } catch {
      showToast("Gagal menghapus item galeri. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Galeri</h1>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Tambah Media</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="gallery-alt">Teks Alternatif</Label>
            <Input id="gallery-alt" value={altText} onChange={(e) => setAltText(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gallery-caption">Keterangan (opsional)</Label>
            <Input id="gallery-caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gallery-category">Kategori</Label>
            <select
              id="gallery-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as GalleryCategory)}
              className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="gallery-file">File</Label>
            <input id="gallery-file" ref={fileInputRef} type="file" accept="image/*,video/*" className="text-small" />
            <p className="mt-1 text-small text-neutral-500">Rekomendasi: 1200×1200px (rasio 1:1). Maksimum 5MB.</p>
          </div>
        </div>
        {validationError && <p className="mt-2 text-small text-red-600">{validationError}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={() => void handleUpload()} disabled={status === "saving"}>
            {status === "saving" ? "Mengunggah..." : "Unggah"}
          </Button>
          <SaveStateIndicator status={status} error={error} />
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items?.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-card bg-white shadow-card">
            <div className="relative aspect-square">
              <Image src={item.media.file_url} alt={item.media.alt_text} fill className="object-cover" />
            </div>
            <div className="p-3">
              <Badge variant="neutral">{CATEGORIES.find((c) => c.value === item.category)?.label}</Badge>
              <button
                type="button"
                onClick={() => setDeleteTargetId(item.id)}
                className="mt-2 block text-small text-red-600 underline"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items?.length === 0 && <p className="text-body text-neutral-600">Belum ada media di galeri.</p>}
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus item galeri ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTargetId);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
