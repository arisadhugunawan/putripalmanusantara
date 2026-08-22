"use client";

import { Badge, Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { ExportDestination, ExportStatus, ProductDetail } from "@ppn/shared-types";
import { WORLD_COUNTRIES } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { getFlagEmoji } from "@/components/home/export-reach/flag-emoji";

const EXPORT_STATUS_OPTIONS: { value: ExportStatus; label: string }[] = [
  { value: "active_destination", label: "Active Destination" },
  { value: "previous_destination", label: "Previous Destination" },
  { value: "potential_market", label: "Potential Market" },
  { value: "inactive", label: "Inactive" },
];

const SORTED_WORLD_COUNTRIES = [...WORLD_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

export function ExportDestinationEditor() {
  const [destinations, setDestinations] = useState<ExportDestination[] | null>(null);
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<ExportDestination[]>("/admin/homepage/export-destinations");
    setDestinations(data);
  }

  async function loadProducts() {
    const data = await adminApi.get<ProductDetail[]>("/admin/products");
    setProducts(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
    void loadProducts();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    // Captured before the `await` below — React nulls `event.currentTarget` once the
    // synchronous event-dispatch task finishes, so reading it after an `await` throws even
    // though the request already succeeded.
    const form = event.currentTarget;
    const formData = new FormData(form);
    const countryCode = formData.get("country_code");
    if (!countryCode) {
      setError("Pilih negara terlebih dahulu.");
      return;
    }
    try {
      await adminApi.post("/admin/homepage/export-destinations", {
        country_code: countryCode,
        order: destinations?.length ?? 0,
        enabled: true,
        featured: false,
      });
      form.reset();
      await load();
      showToast("Negara tujuan berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah negara tujuan.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/homepage/export-destinations/${id}`, patch);
      await load();
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleToggle(destination: ExportDestination, field: "enabled" | "featured") {
    await handleUpdate(destination.id, { [field]: !destination[field] });
    if (field === "enabled") {
      showToast(destination.enabled ? "Negara tujuan berhasil dinonaktifkan." : "Negara tujuan berhasil diaktifkan.");
    } else {
      showToast(destination.featured ? "Negara tujuan tidak lagi Featured." : "Negara tujuan ditandai Featured.");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/homepage/export-destinations/${id}`);
      await load();
      showToast("Negara tujuan berhasil dihapus.");
      setDeleteTargetId(null);
    } catch {
      showToast("Gagal menghapus negara tujuan. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!destinations) return;
    const target = index + direction;
    if (target < 0 || target >= destinations.length) return;
    const a = destinations[index];
    const b = destinations[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/homepage/export-destinations/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/homepage/export-destinations/${b.id}`, { order: a.order }),
      ]);
      await load();
      showToast("Urutan negara tujuan berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui urutan. Silakan coba lagi.", "error");
    }
  }

  async function toggleProduct(destination: ExportDestination, productId: string) {
    const has = destination.products.some((p) => p.id === productId);
    const nextIds = has
      ? destination.products.filter((p) => p.id !== productId).map((p) => p.id)
      : [...destination.products.map((p) => p.id), productId];
    await handleUpdate(destination.id, { product_ids: nextIds });
  }

  const usedCodes = new Set((destinations ?? []).map((d) => d.country_code));
  const availableCountries = SORTED_WORLD_COUNTRIES.filter((c) => !usedCodes.has(c.alpha2));

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Negara Tujuan Ekspor (Global Export Reach)</h2>
      <p className="mt-1 text-small text-neutral-600">
        Menentukan negara yang tersorot di peta interaktif beranda. Hanya negara berstatus
        &ldquo;Active Destination&rdquo; dan &ldquo;Aktif&rdquo; yang tampil ke publik — status
        lain tetap tersimpan di Admin sebagai catatan riwayat/prospek, tidak pernah
        ditampilkan seolah aktif.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {destinations?.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada negara tujuan ekspor.</p>
          </div>
        )}
        {destinations?.map((destination, index) => (
          <div key={destination.id} className="rounded-field border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {getFlagEmoji(destination.country_code)}
              </span>
              <div>
                <p className="font-medium text-neutral-900">{destination.country_name}</p>
                <p className="text-small text-neutral-500">
                  {destination.country_code} / {destination.country_code_alpha3} · Order{" "}
                  {String(index + 1).padStart(2, "0")}
                </p>
              </div>
              <Badge variant={destination.enabled ? "primary" : "neutral"}>
                {destination.enabled ? "Aktif" : "Nonaktif"}
              </Badge>
              {destination.featured && <Badge variant="primary">★ Featured</Badge>}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
              <label className="flex items-center gap-2 text-small text-neutral-600">
                <input
                  type="checkbox"
                  checked={destination.enabled}
                  onChange={() => void handleToggle(destination, "enabled")}
                  className="h-4 w-4"
                />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-small text-neutral-600">
                <input
                  type="checkbox"
                  checked={destination.featured}
                  onChange={() => void handleToggle(destination, "featured")}
                  className="h-4 w-4"
                />
                Featured
              </label>
              <button
                type="button"
                onClick={() => void handleMove(index, -1)}
                disabled={index === 0}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Naik
              </button>
              <button
                type="button"
                onClick={() => void handleMove(index, 1)}
                disabled={index === (destinations?.length ?? 0) - 1}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Turun
              </button>
              <button type="button" onClick={() => setDeleteTargetId(destination.id)} className="ml-auto text-small text-red-600 underline">
                Hapus
              </button>
            </div>

            <div className="mt-3">
              <Label className="text-small">Export Status</Label>
              <select
                defaultValue={destination.export_status}
                onChange={(e) => void handleUpdate(destination.id, { export_status: e.target.value })}
                className="w-full rounded-field border border-neutral-300 px-3 py-2 text-small sm:w-auto"
              >
                {EXPORT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <Label className="text-small">Region (opsional)</Label>
              <Input
                defaultValue={destination.region ?? ""}
                placeholder="cth. Southeast Asia"
                onBlur={(e) => void handleUpdate(destination.id, { region: e.target.value })}
              />
              <p className="mt-1 text-small text-neutral-500">
                Label pengelompokan yang tampil di kartu negara pada beranda maupun halaman About Company.
              </p>
            </div>

            <div className="mt-3">
              <Label className="text-small">Deskripsi Singkat</Label>
              <Textarea
                rows={2}
                defaultValue={destination.description ?? ""}
                onBlur={(e) => void handleUpdate(destination.id, { description: e.target.value })}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-small">Export Volume (opsional)</Label>
                <Input
                  defaultValue={destination.export_volume ?? ""}
                  placeholder="cth. 40 ton/bulan"
                  onBlur={(e) => void handleUpdate(destination.id, { export_volume: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Export Frequency (opsional)</Label>
                <Input
                  defaultValue={destination.export_frequency ?? ""}
                  placeholder="cth. Bulanan"
                  onBlur={(e) => void handleUpdate(destination.id, { export_frequency: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Destination Port (opsional)</Label>
                <Input
                  defaultValue={destination.destination_port ?? ""}
                  placeholder="cth. Laem Chabang"
                  onBlur={(e) => void handleUpdate(destination.id, { destination_port: e.target.value })}
                />
              </div>
            </div>

            {products && products.length > 0 && (
              <div className="mt-3">
                <Label className="text-small">Produk</Label>
                <div className="mt-1 flex flex-wrap gap-3">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 text-small text-neutral-700">
                      <input
                        type="checkbox"
                        checked={destination.products.some((p) => p.id === product.id)}
                        onChange={() => void toggleProduct(destination, product.id)}
                        className="h-4 w-4"
                      />
                      {product.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Tambah Negara Tujuan</p>
        <div>
          <Label htmlFor="new-export-country">Negara</Label>
          <select
            id="new-export-country"
            name="country_code"
            defaultValue=""
            className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
          >
            <option value="" disabled>
              Pilih negara…
            </option>
            {availableCountries.map((c) => (
              <option key={c.alpha2} value={c.alpha2}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Negara
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus negara tujuan ekspor?"
          message="Data negara ini akan dihapus dari daftar tujuan ekspor."
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
