"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { Facility } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useToast } from "@/components/admin/Toast";
import { useAutosaveField } from "@/hooks/useAutosaveField";

// FR-CMS (docs/05-api.md §4.6) — kelola fasilitas + galeri per fasilitas (FR-FAC-02).
export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteGalleryTarget, setDeleteGalleryTarget] = useState<{ facilityId: string; galleryId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<Facility[]>("/admin/facilities");
    setFacilities(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    try {
      await adminApi.post("/admin/facilities", {
        name: formData.get("name"),
        description: formData.get("description"),
      });
      event.currentTarget.reset();
      await load();
      showToast("Fasilitas berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah fasilitas.");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/facilities/${id}`);
      await load();
      showToast("Fasilitas berhasil dihapus.");
      setDeleteTarget(null);
    } catch {
      showToast("Gagal menghapus fasilitas. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteGalleryItem(facilityId: string, galleryId: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/facilities/${facilityId}/gallery/${galleryId}`);
      await load();
      showToast("Foto galeri berhasil dihapus.");
      setDeleteGalleryTarget(null);
    } catch {
      showToast("Gagal menghapus foto galeri. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-h2 text-neutral-900">Fasilitas</h1>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Tambah Fasilitas</h2>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="new-name">Nama</Label>
            <Input id="new-name" name="name" required />
          </div>
          <div>
            <Label htmlFor="new-description">Deskripsi</Label>
            <Textarea id="new-description" name="description" rows={2} required />
          </div>
          {error && <p className="text-small text-red-600">{error}</p>}
          <Button type="submit" className="w-fit">
            Tambah
          </Button>
        </form>
      </Card>

      <div className="mt-8 flex flex-col gap-6">
        {facilities?.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            onReload={load}
            onRequestDelete={() => setDeleteTarget({ id: facility.id, name: facility.name })}
            onRequestDeleteGalleryItem={(galleryId) => setDeleteGalleryTarget({ facilityId: facility.id, galleryId })}
          />
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Hapus fasilitas "${deleteTarget.name}"?`}
          message="Data yang dihapus tidak dapat dikembalikan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTarget.id);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteGalleryTarget && (
        <ConfirmDialog
          title="Hapus foto galeri ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDeleteGalleryItem(deleteGalleryTarget.facilityId, deleteGalleryTarget.galleryId);
          }}
          onCancel={() => setDeleteGalleryTarget(null)}
        />
      )}
    </div>
  );
}

function FacilityCard({
  facility,
  onReload,
  onRequestDelete,
  onRequestDeleteGalleryItem,
}: {
  facility: Facility;
  onReload: () => Promise<void>;
  onRequestDelete: () => void;
  onRequestDeleteGalleryItem: (galleryId: string) => void;
}) {
  const nameField = useAutosaveField(facility.name, (name) =>
    adminApi.put(`/admin/facilities/${facility.id}`, { name }),
  );
  const descriptionField = useAutosaveField(facility.description, (description) =>
    adminApi.put(`/admin/facilities/${facility.id}`, { description }),
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`name-${facility.id}`} className="text-small">
              Nama
            </Label>
            <SaveStateIndicator status={nameField.status} error={nameField.error} />
          </div>
          <Input
            id={`name-${facility.id}`}
            value={nameField.value}
            onChange={(e) => nameField.onChange(e.target.value)}
            onBlur={nameField.onBlur}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <Label htmlFor={`desc-${facility.id}`} className="text-small">
              Deskripsi
            </Label>
            <SaveStateIndicator status={descriptionField.status} error={descriptionField.error} />
          </div>
          <Textarea
            id={`desc-${facility.id}`}
            value={descriptionField.value}
            rows={2}
            onChange={(e) => descriptionField.onChange(e.target.value)}
            onBlur={descriptionField.onBlur}
          />
        </div>
        <button type="button" onClick={onRequestDelete} className="shrink-0 text-small text-red-600 underline">
          Hapus
        </button>
      </div>

      <div className="mt-4">
        <MediaUploadField
          label="Gambar Sampul"
          media={facility.cover_image}
          hint="Rekomendasi: 1200×900px (rasio 4:3). Maksimum 5MB."
          onChange={async (media) => {
            await adminApi.put(`/admin/facilities/${facility.id}`, { cover_image_id: media.id });
            await onReload();
          }}
        />
      </div>

      <div className="mt-4">
        <Label className="text-small">Galeri Fasilitas</Label>
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {facility.gallery.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-field">
              <Image src={item.media.file_url} alt={item.media.alt_text} fill className="object-cover" />
              <button
                type="button"
                onClick={() => onRequestDeleteGalleryItem(item.id)}
                aria-label="Hapus foto ini"
                className="absolute right-1 top-1 rounded-full bg-neutral-900/70 px-2 py-0.5 text-small text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <MediaUploadField
            label="Tambah Foto Galeri"
            media={null}
            hint="Rekomendasi: 1200×1200px (rasio 1:1). Maksimum 5MB."
            onChange={async (media) => {
              await adminApi.post(`/admin/facilities/${facility.id}/gallery`, { media_id: media.id });
              await onReload();
            }}
          />
        </div>
      </div>
    </Card>
  );
}
