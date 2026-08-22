"use client";

import { Badge, Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { ProductionStep, ProductionStepIcon } from "@ppn/shared-types";
import { PRODUCTION_STEP_ICON_LABELS, PRODUCTION_STEP_ICON_KEYS } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { useToast } from "@/components/admin/Toast";

const ICON_OPTIONS = PRODUCTION_STEP_ICON_KEYS.map((value) => ({
  value,
  label: PRODUCTION_STEP_ICON_LABELS[value],
}));

export function ProductionProcessEditor() {
  const [steps, setSteps] = useState<ProductionStep[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState<ProductionStepIcon>("sourcing");
  const [newIllustrationId, setNewIllustrationId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<ProductionStep[]>("/admin/production-steps");
    setSteps(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Captured before the `await` below — React nulls `event.currentTarget` once the
    // synchronous event-dispatch task finishes, so reading it after an `await` throws even
    // though the request already succeeded.
    const form = event.currentTarget;
    setError(null);
    if (!newTitle.trim() || !newDescription.trim()) {
      setError("Title dan Description wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/production-steps", {
        label: newLabel,
        title: newTitle,
        description: newDescription,
        icon: newIcon,
        illustration_id: newIllustrationId ?? undefined,
        order: steps?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewLabel("");
      setNewTitle("");
      setNewDescription("");
      setNewIcon("sourcing");
      setNewIllustrationId(null);
      await load();
      showToast("Tahap proses berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah tahap proses.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/production-steps/${id}`, patch);
      await load();
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/production-steps/${id}`);
      await load();
      showToast("Tahap proses berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus tahap proses. Silakan coba lagi.", "error");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/production-steps/${id}/duplicate`);
      await load();
      showToast("Tahap proses berhasil diduplikasi.");
    } catch {
      showToast("Gagal menduplikasi tahap proses. Silakan coba lagi.", "error");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!steps) return;
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const a = steps[index];
    const b = steps[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/production-steps/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/production-steps/${b.id}`, { order: a.order }),
      ]);
      await load();
    } catch {
      showToast("Gagal memperbarui urutan tahap proses.", "error");
    }
  }

  const filtered = steps?.filter((step) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      step.title.toLowerCase().includes(q) ||
      step.label.toLowerCase().includes(q) ||
      step.description.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Tahapan Proses</h2>
      <p className="mt-1 text-small text-neutral-600">
        Nomor tahap (01, 02, ...) dihitung otomatis dari urutan — tidak perlu diisi manual, dan
        otomatis diperbarui saat Naik/Turun digunakan.
      </p>

      {steps && steps.length > 0 && (
        <div className="mt-4">
          <Input placeholder="Cari label, judul, atau deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {steps?.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada tahap proses yang ditambahkan.</p>
          </div>
        )}
        {steps && steps.length > 0 && filtered?.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada tahap yang cocok dengan pencarian.</p>
        )}
        {filtered?.map((step) => {
          const index = steps!.findIndex((s) => s.id === step.id);
          return (
            <div key={step.id} className="rounded-field border border-neutral-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-small font-semibold text-primary-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-body font-medium text-neutral-900">{step.title}</p>
                    <p className="text-small text-neutral-500">{step.label || "(tanpa label)"}</p>
                  </div>
                </div>
                <Badge variant={step.active ? "primary" : "neutral"}>{step.active ? "Active" : "Inactive"}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={step.active} onChange={(e) => void handleUpdate(step.id, { active: e.target.checked })} className="h-4 w-4" />
                  Aktif
                </label>
                <button type="button" onClick={() => void handleDuplicate(step.id)} className="text-small text-neutral-600 underline">
                  Duplicate
                </button>
                <button type="button" onClick={() => void handleMove(index, -1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleMove(index, 1)}
                  disabled={index === steps!.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(step.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-small">Eyebrow / Label</Label>
                  <Input defaultValue={step.label} onBlur={(e) => void handleUpdate(step.id, { label: e.target.value })} placeholder="mis. PRODUCT SOURCING" />
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
                <div className="sm:col-span-2">
                  <Label className="text-small">Title</Label>
                  <Input defaultValue={step.title} onBlur={(e) => void handleUpdate(step.id, { title: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-small">Description</Label>
                  <Textarea rows={3} defaultValue={step.description} onBlur={(e) => void handleUpdate(step.id, { description: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">CTA Label (opsional)</Label>
                  <Input defaultValue={step.cta_label ?? ""} onBlur={(e) => void handleUpdate(step.id, { cta_label: e.target.value || null })} />
                </div>
                <div>
                  <Label className="text-small">CTA Link (opsional)</Label>
                  <Input defaultValue={step.cta_href ?? ""} onBlur={(e) => void handleUpdate(step.id, { cta_href: e.target.value || null })} placeholder="/products" />
                </div>
              </div>

              <div className="mt-3">
                <MediaUploadField
                  label="Process Image (opsional)"
                  media={step.illustration}
                  onChange={(media) => void handleUpdate(step.id, { illustration_id: media.id })}
                  onRemove={() => void handleUpdate(step.id, { illustration_id: null })}
                  hint="Rekomendasi: 1600×1000px (16:10). Jika kosong, tahap ini tampil dengan ikon saja."
                  previewFit="cover"
                />
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Process Stage</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-step-label">Eyebrow / Label</Label>
            <Input id="new-step-label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="mis. PRODUCT SOURCING" />
          </div>
          <div>
            <Label htmlFor="new-step-icon">Ikon</Label>
            <select
              id="new-step-icon"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value as ProductionStepIcon)}
              className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="new-step-title">Title</Label>
          <Input id="new-step-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="new-step-description">Description</Label>
          <Textarea id="new-step-description" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
        </div>
        <MediaUploadField
          label="Process Image (opsional)"
          media={null}
          onChange={(media) => setNewIllustrationId(media.id)}
          hint="Rekomendasi: 1600×1000px (16:10)."
          previewFit="cover"
        />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Process Stage
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus tahap proses ini?"
          message="Tahap proses akan dihapus dan tidak akan tampil di halaman Homepage maupun Our Supply & Export Process. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
