"use client";

import { Button, Card, cn, Input, Label } from "@ppn/ui-components";
import type { Locale, ShipmentLoadingLocation } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Structured loading-location chips driving the route visual's origin nodes — independent
 * from Shipping Arrangement's own "Loading Locations" summary text. */
export function ShipmentLoadingLocationsEditor() {
  const fetchLocations = useCallback(
    () => adminApi.get<ShipmentLoadingLocation[]>("/admin/about-company/shipment-loading-locations"),
    [],
  );
  const { data: locations, status, reload, retry } = useAdminResource(fetchLocations);

  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newName.trim()) {
      setError("Location Name wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/shipment-loading-locations", {
        name: newName,
        order: locations?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewName("");
      await reload();
      showToast("Loading location ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah lokasi.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>, requiredLabel?: string) {
    if (requiredLabel) {
      const value = Object.values(patch)[0];
      if (typeof value === "string" && !value.trim()) {
        showToast(`${requiredLabel} wajib diisi.`, "error");
        await reload();
        return;
      }
    }
    try {
      await adminApi.put(`/admin/about-company/shipment-loading-locations/${id}`, patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Changes could not be saved.", "error");
      await reload();
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/shipment-loading-locations/${id}`);
      await reload();
      showToast("Loading location dihapus.");
    } catch {
      showToast("Gagal menghapus lokasi. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!locations) return;
    if (to < 0 || to >= locations.length) return;
    const next = arrayMove(locations, from, to);
    try {
      await Promise.all(
        next
          .map((loc, index) =>
            loc.order === index
              ? null
              : adminApi.put(`/admin/about-company/shipment-loading-locations/${loc.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load loading locations." onRetry={() => void retry()} />;

  if (status === "loading" || !locations) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={2} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Loading Locations</h2>
      <p className="mt-1 text-small text-neutral-600">
        Chip lokasi yang menjadi titik asal pada visual rute pengiriman. Kosongkan Maps URL jika
        belum tersedia — jangan gunakan tautan palsu. Seret kartu untuk mengubah urutan, atau
        gunakan Naik/Turun.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {locations.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada loading location.</p>
          </div>
        )}
        {locations.map((location, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={location.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              <span {...getHandleProps(index)} className="mt-7">
                <DragHandle />
              </span>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="text-small">Location Name *</Label>
                    <Input defaultValue={location.name} onBlur={(e) => void handleUpdate(location.id, { name: e.target.value }, "Location Name")} />
                  </div>
                  <div>
                    <Label className="text-small">Region</Label>
                    <Input defaultValue={location.region} onBlur={(e) => void handleUpdate(location.id, { region: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-small">Country</Label>
                    <Input defaultValue={location.country} onBlur={(e) => void handleUpdate(location.id, { country: e.target.value })} />
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-small">Google Maps URL (opsional)</Label>
                  <Input
                    defaultValue={location.maps_url ?? ""}
                    placeholder="https://maps.google.com/..."
                    onBlur={(e) => void handleUpdate(location.id, { maps_url: e.target.value })}
                  />
                  <p className="mt-1 text-small text-neutral-500">Kosong = chip tidak dapat diklik di halaman publik.</p>
                </div>
                <RowTranslationsDisclosure
                  key={`${location.id}-${JSON.stringify(location.translations ?? {})}`}
                  translations={location.translations}
                  fields={[
                    { key: "name", label: "Location Name" },
                    { key: "region", label: "Region" },
                    { key: "country", label: "Country" },
                  ]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(location.id, {
                      translations: {
                        ...(location.translations ?? {}),
                        [locale]: { ...(location.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={location.active} onChange={(e) => void handleUpdate(location.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === locations.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(location.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Location</p>
        <Input placeholder="Location Name, mis. Palu" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Location
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus loading location ini?"
          message="Lokasi akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
