"use client";

import { Button, Card, cn, Input, Label } from "@ppn/ui-components";
import type { Locale, ShipmentContainerType } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Container size options driving the interactive toggle — typically just 2 rows (20-Foot,
 * 40-Foot), so this stays as lean as `MoqPaymentQuickCardsEditor.tsx` (no `ListToolbar`). */
export function ShipmentContainerTypesEditor() {
  const fetchTypes = useCallback(
    () => adminApi.get<ShipmentContainerType[]>("/admin/about-company/shipment-container-types"),
    [],
  );
  const { data: types, status, reload, retry } = useAdminResource(fetchTypes);

  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newLabel.trim()) {
      setError("Label wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/shipment-container-types", {
        label: newLabel,
        order: types?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewLabel("");
      await reload();
      showToast("Container type ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah container type.");
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
      await adminApi.put(`/admin/about-company/shipment-container-types/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/shipment-container-types/${id}`);
      await reload();
      showToast("Container type dihapus.");
    } catch {
      showToast("Gagal menghapus container type. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!types) return;
    if (to < 0 || to >= types.length) return;
    const next = arrayMove(types, from, to);
    try {
      await Promise.all(
        next
          .map((type, index) =>
            type.order === index
              ? null
              : adminApi.put(`/admin/about-company/shipment-container-types/${type.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load container types." onRetry={() => void retry()} />;

  if (status === "loading" || !types) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={2} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Container Types</h2>
      <p className="mt-1 text-small text-neutral-600">
        Pilihan ukuran container untuk toggle interaktif pada visual rute. Seret kartu untuk
        mengubah urutan, atau gunakan Naik/Turun.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {types.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada container type.</p>
          </div>
        )}
        {types.map((type, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={type.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              <span {...getHandleProps(index)} className="mt-7">
                <DragHandle />
              </span>
              <div className="min-w-0 flex-1">
                <Label className="text-small">Label *</Label>
                <Input defaultValue={type.label} onBlur={(e) => void handleUpdate(type.id, { label: e.target.value }, "Label")} />
                <RowTranslationsDisclosure
                  key={`${type.id}-${JSON.stringify(type.translations ?? {})}`}
                  translations={type.translations}
                  fields={[{ key: "label", label: "Label" }]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(type.id, {
                      translations: {
                        ...(type.translations ?? {}),
                        [locale]: { ...(type.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={type.active} onChange={(e) => void handleUpdate(type.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === types.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(type.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Container Type</p>
        <Input placeholder="Label, mis. 20-Foot" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Container Type
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus container type ini?"
          message="Tipe container akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
