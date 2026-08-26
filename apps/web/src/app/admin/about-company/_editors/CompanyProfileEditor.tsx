"use client";

import { Card, cn, Input, Label } from "@ppn/ui-components";
import { getMediaPolicy } from "@ppn/shared-types";
import type { AboutCompanyProfile, ExportDestination } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { useRegisterDraftBuffer } from "@/components/admin/AboutCompanyDraftBuffer";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";
import { CompanyFactsEditor } from "./company/CompanyFactsEditor";
import { CompanyProfileCountriesEditor } from "./company/CompanyProfileCountriesEditor";
import { SocialLinksEditor } from "./company/SocialLinksEditor";
import {
  BusinessScopeEditor,
  ClosingStatementEditor,
  CompanyStoryEditor,
  ExportReachEditor,
  IntroductionEditor,
  LegalInfoEditor,
} from "./company/ProfileBlockEditors";

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_IMAGE_BYTES = getMediaPolicy("general").maxBytes;

export function CompanyProfileEditor() {
  const fetchProfile = useCallback(
    () => adminApi.get<AboutCompanyProfile>("/admin/about-company/profile"),
    [],
  );
  const { data: profile, status, reload, retry } = useAdminResource(fetchProfile);

  // Rich-text fields are buffered rather than saved on blur — a WYSIWYG surface has no
  // meaningful "blur" boundary while the Admin is still formatting. The shell's Save Draft /
  // Discard act on exactly this buffer (see AboutCompanyDraftBuffer).
  const [mainDescription, setMainDescription] = useState("");
  const [companyOverview, setCompanyOverview] = useState("");
  const [buffered, setBuffered] = useState(false);
  // Bumped on Discard to force the rich-text editors to remount. `RichTextEditor` seeds TipTap
  // from `content` once and then owns its own document, so resetting React state alone would
  // leave the discarded text still visible on screen — the editor has to be rebuilt.
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);
  // Read-only count for the Export Reach block's helper text — the countries themselves are
  // managed in the shared Global Export Reach editor, not here. Best-effort: a failure just
  // leaves the count unknown rather than blocking the whole profile editor.
  const [activeDestinationCount, setActiveDestinationCount] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<ExportDestination[]>("/admin/homepage/export-destinations")
      .then((destinations) => {
        if (cancelled) return;
        setActiveDestinationCount(
          destinations.filter((d) => d.enabled && d.export_status === "active_destination").length,
        );
      })
      .catch(() => {
        /* helper text only */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Seeds the buffer from freshly loaded server data. Adjusted during render (React's
  // documented "resetting state when a prop changes" pattern) rather than in an effect, which
  // would cost an extra render pass. Guarded by `buffered`, so a background reload triggered by
  // some other field's autosave can never overwrite an edit in progress.
  const [syncedFrom, setSyncedFrom] = useState<AboutCompanyProfile | null>(null);
  if (profile && profile !== syncedFrom && !buffered) {
    setSyncedFrom(profile);
    setMainDescription(profile.main_description);
    setCompanyOverview(profile.company_overview);
  }

  const saveDescriptions = useCallback(async () => {
    try {
      await adminApi.put("/admin/about-company/profile", {
        main_description: mainDescription,
        company_overview: companyOverview,
      });
      setBuffered(false);
      showToast("Changes saved as draft.");
      return true;
    } catch {
      showToast("Changes could not be saved.", "error");
      return false;
    }
  }, [mainDescription, companyOverview, showToast]);

  const discardDescriptions = useCallback(() => {
    if (!profile) return;
    setMainDescription(profile.main_description);
    setCompanyOverview(profile.company_overview);
    setBuffered(false);
    setEditorEpoch((epoch) => epoch + 1);
  }, [profile]);

  useRegisterDraftBuffer({ isDirty: buffered, save: saveDescriptions, discard: discardDescriptions });

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/profile", patch);
      await reload();
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  async function handleAddGalleryImage(mediaId: string) {
    try {
      await adminApi.post("/admin/about-company/profile/gallery", { media_id: mediaId });
      await reload();
      showToast("Gambar berhasil ditambahkan ke galeri.");
    } catch {
      showToast("Gagal menambah gambar. Silakan coba lagi.", "error");
    }
  }

  async function handleUpdateGalleryItem(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/profile/gallery/${id}`, patch);
      await reload();
    } catch {
      showToast("Gagal menyimpan perubahan galeri.", "error");
    }
  }

  /** Writes a whole new sequential order — used by both drag-and-drop and Naik/Turun, so the
   * two paths can never disagree about what the resulting order is. */
  async function handleReorderGallery(from: number, to: number) {
    if (!profile) return;
    const next = arrayMove(profile.gallery, from, to);
    try {
      await Promise.all(
        next
          .map((item, index) =>
            item.order === index
              ? null
              : adminApi.put(`/admin/about-company/profile/gallery/${item.id}`, { order: index }),
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
      await adminApi.delete(`/admin/about-company/profile/gallery/${id}`);
      await reload();
      showToast("Gambar berhasil dihapus dari galeri.");
    } catch {
      showToast("Gagal menghapus gambar. Silakan coba lagi.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorderGallery(from, to));

  if (status === "error") return <AdminLoadError onRetry={() => void retry()} />;

  if (status === "loading" || !profile) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <SkeletonCard rows={4} />
        <SkeletonCard rows={2} />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-field border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-small text-neutral-600">
          Section ini tersusun dari beberapa blok cerita. Setiap blok punya sakelar “Tampilkan blok ini” sendiri —
          matikan blok yang datanya belum tersedia daripada mengisinya dengan klaim yang belum terkonfirmasi.
          Semua field di bawah tersimpan otomatis sebagai draf saat Anda berpindah field; halaman publik baru
          berubah setelah <strong>Publish</strong>.
        </p>
      </div>

      <GenerateTranslationsPanel
        statusUrl="/admin/about-company/profile/translation-status"
        generateUrl="/admin/about-company/profile/translations/generate"
        onGenerated={() => void reload()}
      />

      <IntroductionEditor profile={profile} onUpdate={(patch) => void handleUpdate(patch)} />
      <SocialLinksEditor />
      <CompanyProfileCountriesEditor />
      <CompanyStoryEditor profile={profile} onUpdate={(patch) => void handleUpdate(patch)} />
      <BusinessScopeEditor profile={profile} onUpdate={(patch) => void handleUpdate(patch)} />

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">04 · Deskripsi Utama</h2>
        <p className="mt-1 text-small text-neutral-600">Deskripsi lengkap perusahaan, tampil sebagai konten utama section ini.</p>
        <div className="mt-3 rounded-field border border-neutral-200">
          <RichTextEditor
            key={`main-description-${editorEpoch}`}
            content={mainDescription}
            onChange={(html) => {
              setMainDescription(html);
              setBuffered(true);
            }}
          />
        </div>

        <h2 className="mt-6 text-h3 text-neutral-900">Company Overview</h2>
        <p className="mt-1 text-small text-neutral-600">Ringkasan tambahan (opsional) — riwayat, jejak operasional, atau konteks lain.</p>
        <div className="mt-3 rounded-field border border-neutral-200">
          <RichTextEditor
            key={`company-overview-${editorEpoch}`}
            content={companyOverview}
            onChange={(html) => {
              setCompanyOverview(html);
              setBuffered(true);
            }}
          />
        </div>

        <p className="mt-4 text-small text-neutral-500">
          {buffered
            ? "Perubahan teks kaya belum disimpan — gunakan Save Draft di bar atas, atau Discard untuk membatalkannya."
            : "Tidak ada perubahan teks kaya yang belum disimpan."}
        </p>
      </Card>

      <CompanyFactsEditor profile={profile} onUpdate={(patch) => void handleUpdate(patch)} />
      <ExportReachEditor
        profile={profile}
        onUpdate={(patch) => void handleUpdate(patch)}
        destinationCount={activeDestinationCount}
      />
      <LegalInfoEditor profile={profile} onUpdate={(patch) => void handleUpdate(patch)} />
      <ClosingStatementEditor profile={profile} onUpdate={(patch) => void handleUpdate(patch)} />

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Company Gallery</h2>
        <p className="mt-1 text-small text-neutral-600">
          Foto tambahan yang mendukung profil perusahaan. Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun.
        </p>

        {profile.gallery.length === 0 && (
          <div className="mt-4 rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada gambar di galeri.</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {profile.gallery.map((item, index) => {
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
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-small">Caption</Label>
                      <Input
                        defaultValue={item.caption ?? ""}
                        onBlur={(e) => void handleUpdateGalleryItem(item.id, { caption: e.target.value })}
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
                      <input
                        type="checkbox"
                        checked={item.featured}
                        onChange={(e) => void handleUpdateGalleryItem(item.id, { featured: e.target.checked })}
                        className="h-4 w-4"
                      />
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
                      disabled={index === profile.gallery.length - 1}
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

      {deleteGalleryId && (
        <ConfirmDialog
          title="Hapus gambar ini?"
          message="Gambar akan dihapus dari galeri dan tidak akan tampil di halaman About Company."
          confirmLabel="Hapus"
          onConfirm={() => void handleDeleteGalleryItem()}
          onCancel={() => setDeleteGalleryId(null)}
        />
      )}
    </>
  );
}
