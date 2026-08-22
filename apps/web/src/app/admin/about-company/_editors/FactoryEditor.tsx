"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import { getMediaPolicy } from "@ppn/shared-types";
import type { FactoryProfile } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DocumentUploadField } from "@/components/admin/DocumentUploadField";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SkeletonCard, SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_IMAGE_BYTES = getMediaPolicy("facility").maxBytes;
const MAX_PDF_BYTES = getMediaPolicy("document").maxBytes;

export function FactoryEditor() {
  const fetchFactory = useCallback(
    () => adminApi.get<FactoryProfile>("/admin/about-company/factory"),
    [],
  );
  const { data: factory, status, reload, retry } = useAdminResource(fetchFactory);

  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/factory", patch);
      await reload();
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  async function handleAddGalleryImage(mediaId: string) {
    try {
      await adminApi.post("/admin/about-company/factory/gallery", { media_id: mediaId });
      await reload();
      showToast("Factory gallery updated.");
    } catch {
      showToast("Upload failed.", "error");
    }
  }

  async function handleUpdateGalleryItem(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/factory/gallery/${id}`, patch);
      await reload();
    } catch {
      showToast("Gagal menyimpan perubahan galeri.", "error");
    }
  }

  async function handleReorderGallery(from: number, to: number) {
    if (!factory) return;
    if (to < 0 || to >= factory.gallery.length) return;
    const next = arrayMove(factory.gallery, from, to);
    try {
      await Promise.all(
        next
          .map((item, index) =>
            item.order === index
              ? null
              : adminApi.put(`/admin/about-company/factory/gallery/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan galeri.", "error");
    }
  }

  async function handleDeleteGalleryItem() {
    if (!deleteGalleryId) return;
    const id = deleteGalleryId;
    setDeleteGalleryId(null);
    try {
      await adminApi.delete(`/admin/about-company/factory/gallery/${id}`);
      await reload();
      showToast("Foto berhasil dihapus dari galeri factory.");
    } catch {
      showToast("Gagal menghapus foto. Silakan coba lagi.", "error");
    }
  }

  async function handleAddDocument(fileId: string) {
    try {
      await adminApi.post("/admin/about-company/factory/documents", { title: "Dokumen Baru", file_id: fileId });
      await reload();
      showToast("Dokumen berhasil ditambahkan.");
    } catch {
      showToast("Gagal menambah dokumen. Silakan coba lagi.", "error");
    }
  }

  async function handleUpdateDocument(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/factory/documents/${id}`, patch);
      await reload();
    } catch {
      showToast("Gagal menyimpan perubahan dokumen.", "error");
    }
  }

  async function handleDeleteDocument() {
    if (!deleteDocumentId) return;
    const id = deleteDocumentId;
    setDeleteDocumentId(null);
    try {
      await adminApi.delete(`/admin/about-company/factory/documents/${id}`);
      await reload();
      showToast("Dokumen berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus dokumen. Silakan coba lagi.", "error");
    }
  }

  async function handleAddVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVideoError(null);
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      setVideoError("Judul dan TikTok URL wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/factory/videos", {
        title: newVideoTitle,
        tiktok_url: newVideoUrl,
      });
      setNewVideoTitle("");
      setNewVideoUrl("");
      await reload();
      showToast("Video berhasil ditambahkan.");
    } catch (err) {
      setVideoError(err instanceof ApiRequestError ? err.message : "Gagal menambah video.");
    }
  }

  async function handleUpdateVideo(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/factory/videos/${id}`, patch);
      await reload();
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  async function handleReorderVideos(from: number, to: number) {
    if (!factory) return;
    if (to < 0 || to >= factory.videos.length) return;
    const next = arrayMove(factory.videos, from, to);
    try {
      await Promise.all(
        next
          .map((video, index) =>
            video.order === index
              ? null
              : adminApi.put(`/admin/about-company/factory/videos/${video.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan video.", "error");
    }
  }

  async function handleDeleteVideo() {
    if (!deleteVideoId) return;
    const id = deleteVideoId;
    setDeleteVideoId(null);
    try {
      await adminApi.delete(`/admin/about-company/factory/videos/${id}`);
      await reload();
      showToast("Video berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus video. Silakan coba lagi.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorderGallery(from, to));
  const { getRowProps: getVideoRowProps, getHandleProps: getVideoHandleProps } = useDragReorder(
    (from, to) => void handleReorderVideos(from, to),
  );

  if (status === "error") return <AdminLoadError message="Failed to load factory information." onRetry={() => void retry()} />;

  if (status === "loading" || !factory) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <SkeletonCard rows={4} />
        <SkeletonListRows rows={2} />
      </div>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Informasi Factory</h2>
        <p className="mt-1 text-small text-neutral-600">
          Isi hanya dengan informasi yang benar-benar dimiliki — biarkan kosong jika belum tersedia.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="fac-eyebrow">Eyebrow</Label>
            <Input id="fac-eyebrow" defaultValue={factory.eyebrow} onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="fac-name">Nama Factory (Heading)</Label>
            <Input id="fac-name" defaultValue={factory.name} onBlur={(e) => void handleUpdate({ name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="fac-short">Deskripsi Singkat</Label>
            <Textarea id="fac-short" rows={2} defaultValue={factory.short_description} onBlur={(e) => void handleUpdate({ short_description: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="fac-detailed">Deskripsi Detail</Label>
            <Textarea id="fac-detailed" rows={4} defaultValue={factory.detailed_description} onBlur={(e) => void handleUpdate({ detailed_description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fac-location">Lokasi (opsional)</Label>
              <Input id="fac-location" defaultValue={factory.location ?? ""} onBlur={(e) => void handleUpdate({ location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="fac-capacity">Kapasitas (opsional)</Label>
              <Input id="fac-capacity" defaultValue={factory.capacity ?? ""} onBlur={(e) => void handleUpdate({ capacity: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="fac-operational">Informasi Operasional (opsional)</Label>
              <Input id="fac-operational" defaultValue={factory.operational_info ?? ""} onBlur={(e) => void handleUpdate({ operational_info: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="fac-notes">Catatan Tambahan (opsional)</Label>
              <Input id="fac-notes" defaultValue={factory.additional_notes ?? ""} onBlur={(e) => void handleUpdate({ additional_notes: e.target.value })} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Featured Videos</h2>
        <p className="mt-1 text-small text-neutral-600">
          Tempel TikTok URL saja — sistem otomatis merender video lewat official TikTok embed, tidak perlu upload
          video. Lebih dari satu video otomatis menjadi carousel di halaman publik. Seret kartu untuk mengubah
          urutan, atau gunakan Naik/Turun.
        </p>

        {factory.videos.length === 0 && (
          <div className="mt-4 rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada video factory.</p>
            <p className="mt-1 text-small text-neutral-500">Gunakan “+ Add TikTok Video” di bawah.</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {factory.videos.map((video, index) => {
            const rowProps = getVideoRowProps(index);
            return (
              <div
                key={video.id}
                {...rowProps}
                className={cn(
                  "flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                  rowProps.className,
                )}
              >
                <span {...getVideoHandleProps(index)}>
                  <DragHandle />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-small">Video Title</Label>
                      <Input defaultValue={video.title} onBlur={(e) => void handleUpdateVideo(video.id, { title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-small">TikTok URL</Label>
                      <Input
                        defaultValue={video.tiktok_url}
                        placeholder="https://www.tiktok.com/@ppn/video/xxxx"
                        onBlur={(e) => void handleUpdateVideo(video.id, { tiktok_url: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-small">Short Description (opsional)</Label>
                      <Input
                        defaultValue={video.description ?? ""}
                        onBlur={(e) => void handleUpdateVideo(video.id, { description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                    <label className="flex items-center gap-2 text-neutral-600">
                      <input type="checkbox" checked={video.active} onChange={(e) => void handleUpdateVideo(video.id, { active: e.target.checked })} className="h-4 w-4" />
                      Aktif
                    </label>
                    <label className="flex items-center gap-2 text-neutral-600">
                      <input type="checkbox" checked={video.featured} onChange={(e) => void handleUpdateVideo(video.id, { featured: e.target.checked })} className="h-4 w-4" />
                      Featured
                    </label>
                    <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                    <button
                      type="button"
                      onClick={() => void handleReorderVideos(index, index - 1)}
                      disabled={index === 0}
                      className="text-neutral-600 underline disabled:opacity-30"
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReorderVideos(index, index + 1)}
                      disabled={index === factory.videos.length - 1}
                      className="text-neutral-600 underline disabled:opacity-30"
                    >
                      Turun
                    </button>
                    <button type="button" onClick={() => setDeleteVideoId(video.id)} className="ml-auto text-red-600 underline">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddVideo} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
          <p className="text-small font-medium text-neutral-900">+ Add TikTok Video</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-video-title">Video Title</Label>
              <Input id="new-video-title" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="new-video-url">TikTok URL</Label>
              <Input
                id="new-video-url"
                type="url"
                placeholder="https://www.tiktok.com/@ppn/video/xxxx"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                required
              />
            </div>
          </div>
          {videoError && <p className="text-small text-red-600">{videoError}</p>}
          <Button type="submit" className="w-fit">
            Add TikTok Video
          </Button>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Factory Gallery</h2>
        <p className="mt-1 text-small text-neutral-600">
          Contoh: Warehouse, Production Area, Loading Area, Container Loading, Weighbridge, Storage Area, Office,
          Exterior. Caption sepenuhnya ditentukan Admin. Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun.
        </p>

        {factory.gallery.length === 0 && (
          <div className="mt-4 rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada foto factory.</p>
            <p className="mt-1 text-small text-neutral-500">Gunakan “+ Add Images” di bawah.</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {factory.gallery.map((item, index) => {
            const rowProps = getRowProps(index);
            return (
              <div
                key={item.id}
                {...rowProps}
                className={cn(
                  "flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                  rowProps.className,
                )}
              >
                <span {...getHandleProps(index)}>
                  <DragHandle />
                </span>
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-50">
                  <Image src={item.media.file_url} alt={item.media.alt_text} fill sizes="128px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label className="text-small">Judul (opsional)</Label>
                      <Input defaultValue={item.title ?? ""} onBlur={(e) => void handleUpdateGalleryItem(item.id, { title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-small">Caption (opsional)</Label>
                      <Input defaultValue={item.caption ?? ""} onBlur={(e) => void handleUpdateGalleryItem(item.id, { caption: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-small">Category (opsional)</Label>
                      <Input
                        defaultValue={item.category ?? ""}
                        placeholder="mis. Warehouse"
                        onBlur={(e) => void handleUpdateGalleryItem(item.id, { category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-small">Alt Text</Label>
                      <Input
                        defaultValue={item.alt_text ?? ""}
                        placeholder={item.media.alt_text}
                        onBlur={(e) => void handleUpdateGalleryItem(item.id, { alt_text: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                    <label className="flex items-center gap-2 text-neutral-600">
                      <input type="checkbox" checked={item.active} onChange={(e) => void handleUpdateGalleryItem(item.id, { active: e.target.checked })} className="h-4 w-4" />
                      Aktif
                    </label>
                    <label className="flex items-center gap-2 text-neutral-600">
                      <input type="checkbox" checked={item.featured} onChange={(e) => void handleUpdateGalleryItem(item.id, { featured: e.target.checked })} className="h-4 w-4" />
                      Featured
                    </label>
                    <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                    <button
                      type="button"
                      onClick={() => void handleReorderGallery(index, index - 1)}
                      disabled={index === 0}
                      className="text-neutral-600 underline disabled:opacity-30"
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReorderGallery(index, index + 1)}
                      disabled={index === factory.gallery.length - 1}
                      className="text-neutral-600 underline disabled:opacity-30"
                    >
                      Turun
                    </button>
                    <button type="button" onClick={() => setDeleteGalleryId(item.id)} className="ml-auto text-red-600 underline">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-4">
          <MediaUploadField
            label="+ Add Images"
            media={null}
            onChange={(media) => void handleAddGalleryImage(media.id)}
            maxSizeBytes={MAX_IMAGE_BYTES}
            hint="Rekomendasi: 1600×1000px. Maksimum 5MB."
          />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Factory Documents (opsional)</h2>
        <p className="mt-1 text-small text-neutral-600">Dokumen pendukung — spesifikasi, layout, atau dokumen fasilitas lainnya.</p>

        {factory.documents.length === 0 && (
          <div className="mt-4 rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada dokumen factory.</p>
            <p className="mt-1 text-small text-neutral-500">Dokumen bersifat opsional untuk section ini.</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {factory.documents.map((doc) => (
            <div key={doc.id} className="rounded-field border border-neutral-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={doc.active ? "primary" : "neutral"}>{doc.active ? "Active" : "Inactive"}</Badge>
                  {doc.file && <Badge variant="neutral">{doc.file.file_type === "pdf" ? "PDF" : "Image"}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={doc.active} onChange={(e) => void handleUpdateDocument(doc.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <button type="button" onClick={() => setDeleteDocumentId(doc.id)} className="text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-small">Judul Dokumen</Label>
                  <Input defaultValue={doc.title} onBlur={(e) => void handleUpdateDocument(doc.id, { title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Deskripsi (opsional)</Label>
                  <Input defaultValue={doc.description ?? ""} onBlur={(e) => void handleUpdateDocument(doc.id, { description: e.target.value })} />
                </div>
              </div>
              <div className="mt-2">
                <DocumentUploadField
                  label="File"
                  media={doc.file}
                  onChange={(media) => void handleUpdateDocument(doc.id, { file_id: media.id })}
                  onRemove={() => void handleUpdateDocument(doc.id, { file_id: null })}
                  maxSizeBytes={MAX_PDF_BYTES}
                  hint="PDF disarankan. Maksimum 10MB."
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-4">
          <DocumentUploadField
            label="Tambah Dokumen"
            media={null}
            onChange={(media) => void handleAddDocument(media.id)}
            maxSizeBytes={MAX_PDF_BYTES}
          />
        </div>
      </Card>

      {deleteGalleryId && (
        <ConfirmDialog
          title="Hapus foto ini?"
          message="Foto akan dihapus dari galeri factory dan tidak akan tampil di halaman About Company."
          confirmLabel="Hapus"
          onConfirm={() => void handleDeleteGalleryItem()}
          onCancel={() => setDeleteGalleryId(null)}
        />
      )}
      {deleteDocumentId && (
        <ConfirmDialog
          title="Hapus dokumen ini?"
          message="Dokumen ini akan dihapus dan tidak akan tampil di halaman About Company."
          confirmLabel="Hapus"
          onConfirm={() => void handleDeleteDocument()}
          onCancel={() => setDeleteDocumentId(null)}
        />
      )}
      {deleteVideoId && (
        <ConfirmDialog
          title="Hapus video ini?"
          message="Video akan dihapus dari Featured Videos dan tidak akan tampil di halaman About Company."
          confirmLabel="Hapus"
          onConfirm={() => void handleDeleteVideo()}
          onCancel={() => setDeleteVideoId(null)}
        />
      )}
    </>
  );
}
