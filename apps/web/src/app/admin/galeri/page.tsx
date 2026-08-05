"use client";

import { Badge, Button, Card, Input, Label } from "@ppn/ui-components";
import type { GalleryCategory, GalleryItem, Media } from "@ppn/shared-types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError("Pilih file dan isi teks alternatif.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", altText);
      const media = await adminApi.post<Media>("/admin/media", formData);
      await adminApi.post("/admin/gallery", {
        media_id: media.id,
        category,
        caption: caption || undefined,
      });
      setAltText("");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal mengunggah media.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus item galeri ini?")) return;
    await adminApi.delete(`/admin/gallery/${id}`);
    await load();
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
          </div>
        </div>
        {error && <p className="mt-2 text-small text-red-600">{error}</p>}
        <Button type="button" onClick={() => void handleUpload()} disabled={uploading} className="mt-4">
          {uploading ? "Mengunggah..." : "Unggah"}
        </Button>
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
                onClick={() => void handleDelete(item.id)}
                className="mt-2 block text-small text-red-600 underline"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items?.length === 0 && <p className="text-body text-neutral-600">Belum ada media di galeri.</p>}
      </div>
    </div>
  );
}
