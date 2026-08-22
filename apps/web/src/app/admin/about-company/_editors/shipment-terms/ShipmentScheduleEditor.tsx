"use client";

import { Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { Locale, ShipmentScheduleStep } from "@ppn/shared-types";
import { SHIPMENT_ICON_KEYS, SHIPMENT_ICON_LABELS } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const ICON_OPTIONS = SHIPMENT_ICON_KEYS.map((value) => ({ value, label: SHIPMENT_ICON_LABELS[value] }));

/** Steps of the compact "Shipping Schedule" mini-timeline. */
export function ShipmentScheduleEditor() {
  const fetchSteps = useCallback(
    () => adminApi.get<ShipmentScheduleStep[]>("/admin/about-company/shipment-schedule-steps"),
    [],
  );
  const { data: steps, status, reload, retry } = useAdminResource(fetchSteps);

  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newName.trim()) {
      setError("Step Name wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/shipment-schedule-steps", {
        name: newName,
        order: steps?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewName("");
      await reload();
      showToast("Schedule step ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah step.");
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
      await adminApi.put(`/admin/about-company/shipment-schedule-steps/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/shipment-schedule-steps/${id}`);
      await reload();
      showToast("Schedule step dihapus.");
    } catch {
      showToast("Gagal menghapus step. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!steps) return;
    if (to < 0 || to >= steps.length) return;
    const next = arrayMove(steps, from, to);
    try {
      await Promise.all(
        next
          .map((step, index) =>
            step.order === index
              ? null
              : adminApi.put(`/admin/about-company/shipment-schedule-steps/${step.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load shipping schedule steps." onRetry={() => void retry()} />;

  if (status === "loading" || !steps) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={5} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Shipping Schedule</h2>
      <p className="mt-1 text-small text-neutral-600">
        Step mini-timeline di dalam kartu &quot;Shipping Schedule&quot;. Seret kartu untuk
        mengubah urutan, atau gunakan Naik/Turun.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {steps.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada schedule step.</p>
          </div>
        )}
        {steps.map((step, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={step.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              <span {...getHandleProps(index)} className="mt-7">
                <DragHandle />
              </span>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-small">Step Name *</Label>
                    <Input defaultValue={step.name} onBlur={(e) => void handleUpdate(step.id, { name: e.target.value }, "Step Name")} />
                  </div>
                  <div>
                    <Label className="text-small">Ikon</Label>
                    <select
                      defaultValue={step.icon}
                      onChange={(e) => void handleUpdate(step.id, { icon: e.target.value })}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon.value} value={icon.value}>
                          {icon.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-small">Description (opsional)</Label>
                  <Textarea rows={2} defaultValue={step.description} onBlur={(e) => void handleUpdate(step.id, { description: e.target.value })} />
                </div>
                <RowTranslationsDisclosure
                  key={`${step.id}-${JSON.stringify(step.translations ?? {})}`}
                  translations={step.translations}
                  fields={[
                    { key: "name", label: "Step Name" },
                    { key: "description", label: "Description" },
                  ]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(step.id, {
                      translations: {
                        ...(step.translations ?? {}),
                        [locale]: { ...(step.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={step.active} onChange={(e) => void handleUpdate(step.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === steps.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(step.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Step</p>
        <Input placeholder="Step Name, mis. Loading" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Step
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus schedule step ini?"
          message="Step akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
