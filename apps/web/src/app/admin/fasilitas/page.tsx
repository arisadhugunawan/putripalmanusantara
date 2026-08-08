"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { Facility } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

// FR-CMS (docs/05-api.md §4.6) — kelola fasilitas + galeri per fasilitas (FR-FAC-02).
export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah fasilitas.");
    }
  }

  async function handleUpdate(id: string, name: string, description: string) {
    await adminApi.put(`/admin/facilities/${id}`, { name, description });
    await load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus fasilitas "${name}"?`)) return;
    await adminApi.delete(`/admin/facilities/${id}`);
    await load();
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
          <Card key={facility.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor={`name-${facility.id}`} className="text-small">
                  Nama
                </Label>
                <Input
                  id={`name-${facility.id}`}
                  defaultValue={facility.name}
                  onBlur={(e) => void handleUpdate(facility.id, e.target.value, facility.description)}
                />
                <Label htmlFor={`desc-${facility.id}`} className="mt-3 text-small">
                  Deskripsi
                </Label>
                <Textarea
                  id={`desc-${facility.id}`}
                  defaultValue={facility.description}
                  rows={2}
                  onBlur={(e) => void handleUpdate(facility.id, facility.name, e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(facility.id, facility.name)}
                className="shrink-0 text-small text-red-600 underline"
              >
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
                  await load();
                }}
              />
            </div>

            <div className="mt-4">
              <Label className="text-small">Galeri Fasilitas</Label>
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {facility.gallery.map((mediaItem, index) => (
                  <div key={`${facility.id}-${index}`} className="relative aspect-square overflow-hidden rounded-field">
                    <Image src={mediaItem.file_url} alt={mediaItem.alt_text} fill className="object-cover" />
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
                    await load();
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
