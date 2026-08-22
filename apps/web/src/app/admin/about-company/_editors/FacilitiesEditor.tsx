"use client";

import { Badge, Card, cn, Input, Label } from "@ppn/ui-components";
import { getMediaPolicy, SUPPORTED_LOCALES } from "@ppn/shared-types";
import type { Facility, Locale, Media } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SkeletonCard, SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Compact per-locale presence indicator — English is always ✓ (it's the source of truth, and
 * per this editor's own doc comment, seed-owned and never admin-edited); the other 5 are ✓
 * only once at least one field actually has translated text. */
function TranslationStatus({ translations }: { translations: Facility["translations"] }) {
  return (
    <span className="flex flex-wrap gap-1.5 text-[11px] font-medium text-neutral-500">
      {SUPPORTED_LOCALES.map((locale) => {
        const complete =
          locale === "en" ||
          Object.values(translations?.[locale as Exclude<Locale, "en">] ?? {}).some(
            (v) => v.trim().length > 0,
          );
        return (
          <span key={locale} className={complete ? "text-primary-700" : "text-neutral-400"}>
            {locale.toUpperCase()} {complete ? "✓" : "—"}
          </span>
        );
      })}
    </span>
  );
}

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_PHOTO_BYTES = getMediaPolicy("facility").maxBytes;
const MIN_PHOTO_WIDTH = 1280;
const MIN_PHOTO_HEIGHT = 720;

/**
 * Facilities is a fixed 10-item master list (brief "Facilities — expand from 4 items to
 * complete 10 facilities") — no more create/delete/duplicate/reorder for facility rows
 * themselves, and name/description/type/location/status are no longer admin-editable (they're
 * owned by `seedFacilities()`). Admin only manages each facility's photos: upload, delete,
 * reorder, and "Set Main" (which photo is the cover shown in the public carousel nav).
 */
export function FacilitiesEditor() {
  const fetchFacilities = useCallback(
    () => adminApi.get<Facility[]>("/admin/about-company/facilities"),
    [],
  );
  const { data: facilities, status, reload, retry } = useAdminResource(fetchFacilities);

  if (status === "error") return <AdminLoadError message="Failed to load facilities." onRetry={() => void retry()} />;

  if (status === "loading" || !facilities) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={0} />
        <div className="mt-4">
          <SkeletonListRows rows={4} />
        </div>
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Facilities</h2>
      <p className="mt-1 text-small text-neutral-600">
        10 fasilitas tetap yang tampil di showcase &quot;Our Facilities&quot;. Nama, deskripsi, dan
        urutan sudah ditetapkan — admin hanya mengelola foto tiap fasilitas.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} onReload={reload} />
        ))}
      </div>
    </Card>
  );
}

function FacilityCard({
  facility,
  onReload,
}: {
  facility: Facility;
  onReload: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const photoCount = facility.gallery.length;
  const { showToast } = useToast();

  async function handleUpdateTranslation(
    locale: Exclude<Locale, "en">,
    field: "name" | "description" | "facilityType" | "location" | "status",
    value: string,
  ) {
    const current = facility.translations ?? {};
    try {
      await adminApi.put(`/admin/about-company/facilities/${facility.id}`, {
        translations: { ...current, [locale]: { ...current[locale], [field]: value } },
      });
      await onReload();
    } catch {
      showToast("Gagal menyimpan terjemahan.", "error");
    }
  }

  return (
    <div className="rounded-field border border-neutral-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-small font-semibold text-primary-800">
          {String(facility.order).padStart(2, "0")}
        </span>
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-50">
          {facility.cover_image ? (
            <Image src={facility.cover_image.file_url} alt={facility.cover_image.alt_text} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-small text-neutral-400">—</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-neutral-900">{facility.name}</p>
          <p className="truncate text-small text-neutral-500">{facility.description}</p>
        </div>
        <Badge variant={photoCount > 0 ? "primary" : "neutral"}>
          {photoCount} {photoCount === 1 ? "Photo" : "Photos"}
          {photoCount === 0 && " — Needs Photos"}
        </Badge>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-small font-medium text-primary-700 underline-offset-4 hover:underline"
        >
          {expanded ? "Tutup" : "Manage Photos"}
        </button>
      </div>

      {expanded && <FacilityPhotoManager facility={facility} onReload={onReload} />}

      <details className="mt-3 border-t border-neutral-100 pt-3">
        <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
          🌐 Translations
          <TranslationStatus translations={facility.translations} />
        </summary>
        <div className="mt-3">
          <LocaleTabs>
            {(locale) =>
              locale === "en" ? (
                <p className="text-small text-neutral-500">
                  Nama/deskripsi bahasa Inggris ditetapkan oleh daftar 10 fasilitas tetap dan
                  tidak dapat diubah admin (lihat catatan di atas halaman ini).
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="text-small">Nama</Label>
                    <Input
                      defaultValue={facility.translations?.[locale]?.name ?? ""}
                      placeholder={facility.name}
                      onBlur={(e) => void handleUpdateTranslation(locale, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Deskripsi</Label>
                    <Input
                      defaultValue={facility.translations?.[locale]?.description ?? ""}
                      placeholder={facility.description}
                      onBlur={(e) => void handleUpdateTranslation(locale, "description", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Tipe Fasilitas (opsional)</Label>
                    <Input
                      defaultValue={facility.translations?.[locale]?.facilityType ?? ""}
                      placeholder={facility.facility_type ?? ""}
                      onBlur={(e) => void handleUpdateTranslation(locale, "facilityType", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Lokasi (opsional)</Label>
                    <Input
                      defaultValue={facility.translations?.[locale]?.location ?? ""}
                      placeholder={facility.location ?? ""}
                      onBlur={(e) => void handleUpdateTranslation(locale, "location", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Status (opsional)</Label>
                    <Input
                      defaultValue={facility.translations?.[locale]?.status ?? ""}
                      placeholder={facility.status ?? ""}
                      onBlur={(e) => void handleUpdateTranslation(locale, "status", e.target.value)}
                    />
                  </div>
                  <p className="text-small text-neutral-500">
                    Kosongkan untuk memakai teks Inggris sebagai fallback.
                  </p>
                </div>
              )
            }
          </LocaleTabs>
        </div>
      </details>
    </div>
  );
}

function FacilityPhotoManager({
  facility,
  onReload,
}: {
  facility: Facility;
  onReload: () => Promise<void>;
}) {
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function setMain(mediaId: string) {
    try {
      await adminApi.put(`/admin/about-company/facilities/${facility.id}`, { cover_image_id: mediaId });
      await onReload();
      showToast("Foto utama diperbarui.");
    } catch {
      showToast("Gagal mengatur foto utama.", "error");
    }
  }

  async function handleUpload(media: Media) {
    try {
      await adminApi.post(`/admin/about-company/facilities/${facility.id}/gallery`, { media_id: media.id });
      // First-ever photo for this facility becomes the main photo automatically.
      if (facility.gallery.length === 0 && !facility.cover_image) {
        await adminApi.put(`/admin/about-company/facilities/${facility.id}`, { cover_image_id: media.id });
      }
      await onReload();
      showToast("Foto berhasil diunggah.");
    } catch {
      showToast("Gagal mengunggah foto.", "error");
    }
  }

  async function handleDeletePhoto() {
    if (!deleteGalleryId) return;
    const id = deleteGalleryId;
    setDeleteGalleryId(null);
    try {
      await adminApi.delete(`/admin/about-company/facilities/gallery/${id}`);
      await onReload();
      showToast("Foto dihapus.");
    } catch {
      showToast("Gagal menghapus foto.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (to < 0 || to >= facility.gallery.length) return;
    const next = arrayMove(facility.gallery, from, to);
    try {
      await Promise.all(
        next
          .map((item, index) =>
            item.order === index
              ? null
              : adminApi.put(`/admin/about-company/facilities/gallery/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await onReload();
    } catch {
      showToast("Gagal memperbarui urutan foto.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
        {facility.name} — Photo Manager
      </p>

      {facility.gallery.length === 0 && (
        <div className="mt-3 rounded-field border border-dashed border-neutral-300 p-6 text-center">
          <p className="text-small text-neutral-600">Belum ada foto untuk fasilitas ini.</p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {facility.gallery.map((item, index) => {
          const isMain = facility.cover_image?.id === item.media.id;
          const rowProps = getRowProps(index);
          return (
            <div
              key={item.id}
              {...rowProps}
              className={cn(
                "group relative overflow-hidden rounded-field border transition-opacity",
                isMain ? "border-primary-400 ring-2 ring-primary-200" : "border-neutral-200",
                rowProps.className,
              )}
            >
              <div className="relative aspect-4/3 w-full bg-neutral-50">
                <Image src={item.media.file_url} alt={item.media.alt_text} fill sizes="240px" className="object-cover" />
              </div>
              <span
                {...getHandleProps(index)}
                className="absolute left-1.5 top-1.5 rounded-full bg-white/90 p-1 shadow-sm"
              >
                <DragHandle />
              </span>
              {isMain && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-semibold text-neutral-900 shadow-sm">
                  ★ Main
                </span>
              )}
              <div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5">
                {!isMain ? (
                  <button
                    type="button"
                    onClick={() => void setMain(item.media.id)}
                    className="text-small text-primary-700 underline-offset-4 hover:underline"
                  >
                    Set Main
                  </button>
                ) : (
                  <span className="text-small text-neutral-400">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteGalleryId(item.id)}
                  className="text-small text-red-600 underline-offset-4 hover:underline"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <MediaUploadField
          label="+ Upload Photos"
          media={null}
          onChange={(media) => void handleUpload(media)}
          maxSizeBytes={MAX_PHOTO_BYTES}
          minWidth={MIN_PHOTO_WIDTH}
          minHeight={MIN_PHOTO_HEIGHT}
          hint="Rekomendasi: 2560×1440px, minimum 1280×720px, rasio 16:9. Maksimum 5MB. Bisa diunggah berkali-kali."
        />
      </div>

      {deleteGalleryId && (
        <ConfirmDialog
          title="Hapus foto ini?"
          message="Foto akan dihapus dari galeri fasilitas. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDeletePhoto()}
          onCancel={() => setDeleteGalleryId(null)}
        />
      )}
    </div>
  );
}
