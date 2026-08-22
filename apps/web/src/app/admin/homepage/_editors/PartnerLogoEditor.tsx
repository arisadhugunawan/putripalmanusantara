"use client";

import { Badge, Button, Card, Input, Label } from "@ppn/ui-components";
import type { PartnerLogo } from "@ppn/shared-types";
import { PARTNER_LOGO_SUGGESTED_CATEGORIES } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PartnerLogoPreviewModal } from "@/components/admin/PartnerLogoPreviewModal";
import { useToast } from "@/components/admin/Toast";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

export function PartnerLogoEditor() {
  const [logos, setLogos] = useState<PartnerLogo[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [newLogoMediaId, setNewLogoMediaId] = useState<string | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<{ file_url: string; alt_text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [previewLogo, setPreviewLogo] = useState<PartnerLogo | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function load() {
    try {
      const data = await adminApi.get<PartnerLogo[]>("/admin/homepage/partner-logos");
      setLogos(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newLogoMediaId) {
      setError("Unggah logo terlebih dahulu (gunakan aset resmi dari sumber institusi, bukan logo tidak resmi).");
      return;
    }
    // Captured before the `await` below — React nulls `event.currentTarget` once the
    // synchronous event-dispatch task finishes, so reading it after an `await` throws even
    // though the request already succeeded.
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await adminApi.post("/admin/homepage/partner-logos", {
        logo_id: newLogoMediaId,
        partner_name: formData.get("partner_name"),
        description: formData.get("description") || undefined,
        category: formData.get("category") || undefined,
        website_url: formData.get("website_url") || undefined,
        alt_text: formData.get("alt_text") || undefined,
        open_in_new_tab: true,
        order: logos?.length ?? 0,
        enabled: true,
        featured: true,
      });
      form.reset();
      setNewLogoMediaId(null);
      setNewLogoPreview(null);
      await load();
      showToast("Logo berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah logo mitra.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/homepage/partner-logos/${id}`, patch);
      await load();
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleToggle(logo: PartnerLogo, field: "enabled" | "featured") {
    await handleUpdate(logo.id, { [field]: !logo[field] });
    if (field === "enabled") {
      showToast(logo.enabled ? "Logo berhasil dinonaktifkan." : "Logo berhasil diaktifkan.");
    } else {
      showToast(logo.featured ? "Logo berhasil dihapus dari marquee." : "Logo berhasil ditambahkan ke marquee.");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/homepage/partner-logos/${id}`);
      await load();
      showToast("Logo berhasil dihapus.");
      setDeleteTargetId(null);
    } catch {
      showToast("Gagal menghapus logo. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/homepage/partner-logos/${id}/duplicate`);
      await load();
      showToast("Logo berhasil diduplikasi.");
    } catch {
      showToast("Gagal menduplikasi logo. Silakan coba lagi.", "error");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!logos) return;
    const target = index + direction;
    if (target < 0 || target >= logos.length) return;
    const a = logos[index];
    const b = logos[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/homepage/partner-logos/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/homepage/partner-logos/${b.id}`, { order: a.order }),
      ]);
      await load();
      showToast("Urutan logo berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui urutan logo. Silakan coba lagi.", "error");
    }
  }

  const filteredLogos = logos?.filter((logo) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return logo.partner_name.toLowerCase().includes(q) || logo.category.toLowerCase().includes(q);
  });

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Logo Mitra & Institusi</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ditampilkan sebagai marquee berjalan di beranda dengan warna logo asli (tanpa filter
        warna). Kosong secara default — hanya gunakan aset logo resmi dari sumber institusi
        terkait; jika logo resmi belum tersedia, jangan unggah versi tidak resmi.
        &ldquo;Aktif&rdquo; menyimpan data di Admin; &ldquo;Featured&rdquo; adalah saklar
        terpisah yang benar-benar menampilkannya di marquee beranda.
      </p>

      {loadError && (
        <div className="mt-4 rounded-field border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-small text-red-700">Gagal memuat data logo.</p>
          <button type="button" onClick={() => void load()} className="mt-2 text-small font-medium text-red-700 underline">
            Coba Lagi
          </button>
        </div>
      )}

      {logos && logos.length > 0 && (
        <div className="mt-4">
          <Input
            placeholder="Cari nama mitra atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {logos?.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada logo mitra atau institusi.</p>
          </div>
        )}
        {logos && logos.length > 0 && filteredLogos?.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada logo yang cocok dengan pencarian.</p>
        )}
        {filteredLogos?.map((logo) => {
          const index = logos!.findIndex((l) => l.id === logo.id);
          return (
            <div key={logo.id} className="rounded-field border border-neutral-200 p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-28 w-64 max-w-full shrink-0 items-center justify-center rounded-field border border-neutral-200 bg-white p-4">
                  <div className="relative h-full w-full">
                    <Image src={logo.logo.file_url} alt={logo.logo.alt_text} fill sizes="256px" className="object-contain" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-neutral-900">{logo.partner_name}</p>
                  <p className="text-small text-neutral-500">{logo.category}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={logo.enabled ? "primary" : "neutral"}>{logo.enabled ? "Active" : "Inactive"}</Badge>
                    <Badge variant={logo.featured ? "primary" : "neutral"}>{logo.featured ? "★ Featured" : "Not Featured"}</Badge>
                    <span className="text-small text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={logo.enabled} onChange={() => void handleToggle(logo, "enabled")} className="h-4 w-4" />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={logo.featured} onChange={() => void handleToggle(logo, "featured")} className="h-4 w-4" />
                  Featured
                </label>
                <button type="button" onClick={() => setPreviewLogo(logo)} className="text-small text-primary-700 underline">
                  Preview
                </button>
                <button type="button" onClick={() => void handleDuplicate(logo.id)} className="text-small text-neutral-600 underline">
                  Duplicate
                </button>
                <button type="button" onClick={() => void handleMove(index, -1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleMove(index, 1)}
                  disabled={index === logos!.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(logo.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-small">Nama Mitra/Institusi</Label>
                  <Input defaultValue={logo.partner_name} onBlur={(e) => void handleUpdate(logo.id, { partner_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Kategori</Label>
                  <Input list="partner-categories" defaultValue={logo.category} onBlur={(e) => void handleUpdate(logo.id, { category: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor={`logo-desc-${logo.id}`} className="text-small">
                    Deskripsi Singkat
                  </Label>
                  <Input
                    id={`logo-desc-${logo.id}`}
                    defaultValue={logo.description ?? ""}
                    onBlur={(e) => void handleUpdate(logo.id, { description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`logo-alt-${logo.id}`} className="text-small">
                    Alt Text (kosongkan untuk memakai Nama Mitra)
                  </Label>
                  <Input
                    id={`logo-alt-${logo.id}`}
                    defaultValue={logo.alt_text ?? ""}
                    onBlur={(e) => void handleUpdate(logo.id, { alt_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-small">Website URL</Label>
                  <Input
                    placeholder="https://..."
                    defaultValue={logo.website_url ?? ""}
                    onBlur={(e) => void handleUpdate(logo.id, { website_url: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-small text-neutral-600">
                  <input
                    type="checkbox"
                    checked={logo.open_in_new_tab}
                    onChange={(e) => void handleUpdate(logo.id, { open_in_new_tab: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Buka tautan di tab baru
                </label>
              </div>

              <div className="mt-3">
                <MediaUploadField
                  label="Ganti Logo"
                  media={logo.logo}
                  onChange={(media) => void handleUpdate(logo.id, { logo_id: media.id })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <datalist id="partner-categories">
        {PARTNER_LOGO_SUGGESTED_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Tambah Logo Mitra</p>
        <p className="text-small text-neutral-600">
          Cukup unggah gambar dan nama mitra — deskripsi, kategori, URL, dan detail lain bisa
          diisi belakangan lewat kartu di atas setelah logo ditambahkan.
        </p>
        <MediaUploadField
          label="Logo Resmi (SVG/PNG transparan disarankan)"
          media={
            newLogoPreview
              ? {
                  id: newLogoMediaId!,
                  file_url: newLogoPreview.file_url,
                  file_type: "image",
                  alt_text: newLogoPreview.alt_text,
                  width: null,
                  height: null,
                  uploaded_at: new Date().toISOString(),
                }
              : null
          }
          onChange={(media) => {
            setNewLogoMediaId(media.id);
            setNewLogoPreview({ file_url: media.file_url, alt_text: media.alt_text });
          }}
        />
        <div>
          <Label htmlFor="new-logo-name">Nama Mitra/Institusi</Label>
          <Input id="new-logo-name" name="partner_name" required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Logo
        </Button>
      </form>

      {previewLogo && <PartnerLogoPreviewModal logo={previewLogo} onClose={() => setPreviewLogo(null)} />}
      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus Logo?"
          message="Logo ini akan dihapus dari daftar mitra dan institusi. Data yang dihapus tidak dapat dikembalikan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTargetId);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
