"use client";

import { Badge, Button, Card, Input, Label } from "@ppn/ui-components";
import type { Locale, ShippingPartner, ShippingRelationshipType } from "@ppn/shared-types";
import { SHIPPING_RELATIONSHIP_TYPE_LABELS, SHIPPING_RELATIONSHIP_TYPES } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { ShippingPartnerPreviewModal } from "@/components/admin/ShippingPartnerPreviewModal";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

const SHIPPING_RELATIONSHIP_OPTIONS: { value: ShippingRelationshipType; label: string }[] =
  SHIPPING_RELATIONSHIP_TYPES.map((value) => ({ value, label: SHIPPING_RELATIONSHIP_TYPE_LABELS[value] }));

export function ShippingPartnerEditor() {
  const [partners, setPartners] = useState<ShippingPartner[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [newLogoMediaId, setNewLogoMediaId] = useState<string | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<{ file_url: string; alt_text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "featured" | "not_featured">("all");
  const [previewPartner, setPreviewPartner] = useState<ShippingPartner | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function load() {
    try {
      const data = await adminApi.get<ShippingPartner[]>("/admin/homepage/shipping-partners");
      setPartners(data);
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
      setError("Unggah logo terlebih dahulu.");
      return;
    }
    // Captured before the `await` below — React nulls `event.currentTarget` once the
    // synchronous event-dispatch task finishes, so reading it after an `await` throws even
    // though the request already succeeded.
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await adminApi.post("/admin/homepage/shipping-partners", {
        logo_id: newLogoMediaId,
        partner_name: formData.get("partner_name"),
        relationship_type: formData.get("relationship_type") || "shipping_partner",
        order: partners?.length ?? 0,
        enabled: true,
        featured: true,
      });
      form.reset();
      setNewLogoMediaId(null);
      setNewLogoPreview(null);
      await load();
      showToast("Shipping partner berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah shipping partner.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/homepage/shipping-partners/${id}`, patch);
      await load();
      showToast("Shipping partner berhasil diperbarui.");
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleUpdateTranslation(partner: ShippingPartner, locale: Exclude<Locale, "en">, value: string) {
    const current = partner.translations ?? {};
    await handleUpdate(partner.id, {
      translations: { ...current, [locale]: { ...current[locale], partnerName: value } },
    });
  }

  async function handleToggle(partner: ShippingPartner, field: "enabled" | "featured") {
    try {
      await adminApi.put(`/admin/homepage/shipping-partners/${partner.id}`, { [field]: !partner[field] });
      await load();
      if (field === "enabled") {
        showToast(partner.enabled ? "Shipping partner berhasil dinonaktifkan." : "Shipping partner berhasil diaktifkan.");
      } else {
        showToast(partner.featured ? "Shipping partner dihapus dari carousel." : "Shipping partner ditambahkan ke carousel.");
      }
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/homepage/shipping-partners/${id}`);
      await load();
      showToast("Shipping partner berhasil dihapus.");
      setDeleteTargetId(null);
    } catch {
      showToast("Gagal menghapus shipping partner. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/homepage/shipping-partners/${id}/duplicate`);
      await load();
      showToast("Shipping partner berhasil diduplikasi.");
    } catch {
      showToast("Gagal menduplikasi shipping partner. Silakan coba lagi.", "error");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!partners) return;
    const target = index + direction;
    if (target < 0 || target >= partners.length) return;
    const a = partners[index];
    const b = partners[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/homepage/shipping-partners/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/homepage/shipping-partners/${b.id}`, { order: a.order }),
      ]);
      await load();
      showToast("Urutan shipping partner berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui urutan. Silakan coba lagi.", "error");
    }
  }

  const filteredPartners = partners
    ?.filter((partner) => {
      if (statusFilter === "active") return partner.enabled;
      if (statusFilter === "inactive") return !partner.enabled;
      if (statusFilter === "featured") return partner.featured;
      if (statusFilter === "not_featured") return !partner.featured;
      return true;
    })
    .filter((partner) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        partner.partner_name.toLowerCase().includes(q) ||
        SHIPPING_RELATIONSHIP_TYPE_LABELS[partner.relationship_type].toLowerCase().includes(q) ||
        (partner.website_url ?? "").toLowerCase().includes(q)
      );
    });

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Global Shipping Partners</h2>
      <p className="mt-1 text-small text-neutral-600">
        Kelola logo shipping dan logistics partner yang ditampilkan di beranda. Warna logo asli
        selalu dipertahankan (tanpa filter). Kosong secara default — hanya gunakan aset logo
        resmi, dan isi Relationship Type sesuai hubungan sebenarnya (jangan mengklaim
        &ldquo;Official Partner&rdquo; tanpa konfirmasi). &ldquo;Aktif&rdquo; menyimpan data di
        Admin; &ldquo;Featured&rdquo; adalah saklar terpisah yang benar-benar menampilkannya di
        carousel beranda.
      </p>

      {loadError && (
        <div className="mt-4 rounded-field border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-small text-red-700">Gagal memuat data shipping partner.</p>
          <button type="button" onClick={() => void load()} className="mt-2 text-small font-medium text-red-700 underline">
            Coba Lagi
          </button>
        </div>
      )}

      {partners && partners.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Cari nama, relationship type, atau website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "Semua" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "featured", label: "Featured" },
                { value: "not_featured", label: "Not Featured" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-field border px-3 py-1.5 text-small ${
                  statusFilter === opt.value
                    ? "border-primary-600 bg-primary-50 font-medium text-primary-700"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {partners?.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">No shipping partners have been added yet.</p>
          </div>
        )}
        {partners && partners.length > 0 && filteredPartners?.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada shipping partner yang cocok dengan filter/pencarian.</p>
        )}
        {filteredPartners?.map((partner) => {
          const index = partners!.findIndex((p) => p.id === partner.id);
          return (
            <div key={partner.id} className="rounded-field border border-neutral-200 p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-32 w-64 max-w-full shrink-0 items-center justify-center rounded-[20px] border border-neutral-200 bg-white p-6">
                  <div className="relative h-full w-full">
                    <Image
                      src={partner.logo.file_url}
                      alt={partner.logo.alt_text}
                      fill
                      sizes="256px"
                      style={{ filter: "none", opacity: 1, mixBlendMode: "normal" }}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-neutral-900">{partner.partner_name}</p>
                  <p className="text-small text-neutral-500">{SHIPPING_RELATIONSHIP_TYPE_LABELS[partner.relationship_type]}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={partner.enabled ? "primary" : "neutral"}>{partner.enabled ? "Active" : "Inactive"}</Badge>
                    <Badge variant={partner.featured ? "primary" : "neutral"}>{partner.featured ? "★ Featured" : "Not Featured"}</Badge>
                    <span className="text-small text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="mt-1 text-small text-neutral-400">
                    Diperbarui {new Date(partner.updated_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={partner.enabled} onChange={() => void handleToggle(partner, "enabled")} className="h-4 w-4" />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={partner.featured} onChange={() => void handleToggle(partner, "featured")} className="h-4 w-4" />
                  Featured
                </label>
                <button type="button" onClick={() => setPreviewPartner(partner)} className="text-small text-primary-700 underline">
                  Preview
                </button>
                <button type="button" onClick={() => void handleDuplicate(partner.id)} className="text-small text-neutral-600 underline">
                  Duplicate
                </button>
                <button type="button" onClick={() => void handleMove(index, -1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleMove(index, 1)}
                  disabled={index === partners!.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(partner.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-small">Nama Partner</Label>
                  <Input defaultValue={partner.partner_name} onBlur={(e) => void handleUpdate(partner.id, { partner_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Relationship Type</Label>
                  <select
                    defaultValue={partner.relationship_type}
                    onChange={(e) => void handleUpdate(partner.id, { relationship_type: e.target.value })}
                    className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
                  >
                    {SHIPPING_RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-small">Deskripsi Singkat (opsional)</Label>
                  <Input
                    defaultValue={partner.description ?? ""}
                    onBlur={(e) => void handleUpdate(partner.id, { description: e.target.value })}
                  />
                  <p className="mt-1 text-small text-neutral-500">
                    Deskripsi ini tidak tampil di halaman publik saat ini, jadi belum tersedia terjemahannya.
                  </p>
                </div>
                <div>
                  <Label className="text-small">Website URL</Label>
                  <Input
                    placeholder="https://..."
                    defaultValue={partner.website_url ?? ""}
                    onBlur={(e) => void handleUpdate(partner.id, { website_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-small">Alt Text (kosongkan untuk memakai Nama Partner)</Label>
                  <Input
                    defaultValue={partner.alt_text ?? ""}
                    onBlur={(e) => void handleUpdate(partner.id, { alt_text: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-small text-neutral-600">
                  <input
                    type="checkbox"
                    checked={partner.open_in_new_tab}
                    onChange={(e) => void handleUpdate(partner.id, { open_in_new_tab: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Buka tautan di tab baru
                </label>
              </div>

              <div className="mt-3">
                <MediaUploadField
                  label="Ganti Logo"
                  media={partner.logo}
                  maxSizeBytes={5 * 1024 * 1024}
                  onChange={(media) => void handleUpdate(partner.id, { logo_id: media.id })}
                />
              </div>

              <details className="mt-3 border-t border-neutral-100 pt-3">
                <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                  🌐 Translations
                  <TranslationStatusBadges
                    translations={partner.translations}
                    base={{ partnerName: partner.partner_name }}
                  />
                </summary>
                <div className="mt-3">
                  <GenerateTranslationsPanel
                    statusUrl={`/admin/homepage/shipping-partners/${partner.id}/translation-status`}
                    generateUrl={`/admin/homepage/shipping-partners/${partner.id}/translations/generate`}
                    onGenerated={() => void load()}
                  />
                  <LocaleTabs>
                    {(locale) =>
                      locale === "en" ? (
                        <p className="text-small text-neutral-500">
                          Bahasa Inggris diedit langsung pada field Nama Partner di atas.
                        </p>
                      ) : (
                        <div>
                          <Label className="text-small">Nama Partner</Label>
                          <Input
                            defaultValue={partner.translations?.[locale]?.partnerName ?? ""}
                            placeholder={partner.partner_name}
                            onBlur={(e) => void handleUpdateTranslation(partner, locale, e.target.value)}
                          />
                          <p className="mt-1 text-small text-neutral-500">
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
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Shipping Partner</p>
        <p className="text-small text-neutral-600">
          Cukup unggah logo, nama partner, dan relationship type — deskripsi, website, dan
          detail lain bisa diisi belakangan lewat kartu di atas setelah partner ditambahkan.
        </p>
        <MediaUploadField
          label="Logo Resmi (SVG/PNG transparan disarankan, maks. 5MB)"
          maxSizeBytes={5 * 1024 * 1024}
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-ship-name">Partner Name</Label>
            <Input id="new-ship-name" name="partner_name" required />
          </div>
          <div>
            <Label htmlFor="new-ship-type">Relationship Type</Label>
            <select
              id="new-ship-type"
              name="relationship_type"
              defaultValue="shipping_partner"
              className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
            >
              {SHIPPING_RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          + Add Shipping Partner
        </Button>
      </form>

      {previewPartner && <ShippingPartnerPreviewModal partner={previewPartner} onClose={() => setPreviewPartner(null)} />}
      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus shipping partner?"
          message="Data ini akan dihapus dari daftar Global Shipping Partner."
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
