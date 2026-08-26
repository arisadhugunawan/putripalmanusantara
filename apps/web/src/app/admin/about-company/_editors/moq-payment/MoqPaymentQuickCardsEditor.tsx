"use client";

import { Button, Card, cn, Input, Label } from "@ppn/ui-components";
import type { Locale, MoqPaymentQuickCard } from "@ppn/shared-types";
import { MOQ_PAYMENT_QUICK_CARD_ICON_KEYS, MOQ_PAYMENT_QUICK_CARD_ICON_LABELS } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const ICON_OPTIONS = MOQ_PAYMENT_QUICK_CARD_ICON_KEYS.map((value) => ({
  value,
  label: MOQ_PAYMENT_QUICK_CARD_ICON_LABELS[value],
}));

/** The 4 compact highlight cards above the Business Terms panel — a lean list (no
 * Duplicate/Featured, unlike the richer Facilities list) since these are simple label+value
 * highlights, not a rich entity. */
export function MoqPaymentQuickCardsEditor() {
  const fetchCards = useCallback(
    () => adminApi.get<MoqPaymentQuickCard[]>("/admin/about-company/moq-payment-quick-cards"),
    [],
  );
  const { data: cards, status, reload, retry } = useAdminResource(fetchCards);

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
      await adminApi.post("/admin/about-company/moq-payment-quick-cards", {
        label: newLabel,
        order: cards?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewLabel("");
      await reload();
      showToast("Quick card ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah quick card.");
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
      await adminApi.put(`/admin/about-company/moq-payment-quick-cards/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/moq-payment-quick-cards/${id}`);
      await reload();
      showToast("Quick card dihapus.");
    } catch {
      showToast("Gagal menghapus quick card. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!cards) return;
    if (to < 0 || to >= cards.length) return;
    const next = arrayMove(cards, from, to);
    try {
      await Promise.all(
        next
          .map((card, index) =>
            card.order === index
              ? null
              : adminApi.put(`/admin/about-company/moq-payment-quick-cards/${card.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load quick overview cards." onRetry={() => void retry()} />;

  if (status === "loading" || !cards) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={4} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Quick Overview Cards</h2>
      <p className="mt-1 text-small text-neutral-600">
        4 kartu ringkas di atas panel Business Terms (MOQ / Payment / Shipment / Currency).
        Kosongkan Value untuk menyembunyikan kartu di halaman publik. Seret kartu untuk mengubah
        urutan, atau gunakan Naik/Turun.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {cards.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada quick overview card.</p>
          </div>
        )}
        {cards.map((card, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={card.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              <span {...getHandleProps(index)} className="mt-7">
                <DragHandle />
              </span>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="text-small">Label *</Label>
                    <Input defaultValue={card.label} onBlur={(e) => void handleUpdate(card.id, { label: e.target.value }, "Label")} />
                  </div>
                  <div>
                    <Label className="text-small">Value (opsional)</Label>
                    <Input
                      defaultValue={card.value}
                      placeholder="mis. 1 x 20ft Container"
                      onBlur={(e) => void handleUpdate(card.id, { value: e.target.value })}
                    />
                    <p className="mt-1 text-small text-neutral-500">Kosong = kartu disembunyikan di publik.</p>
                  </div>
                  <div>
                    <Label className="text-small">Ikon</Label>
                    <select
                      defaultValue={card.icon}
                      onChange={(e) => void handleUpdate(card.id, { icon: e.target.value })}
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
                <GenerateTranslationsPanel
                  statusUrl={`/admin/about-company/moq-payment-quick-cards/${card.id}/translation-status`}
                  generateUrl={`/admin/about-company/moq-payment-quick-cards/${card.id}/translations/generate`}
                  onGenerated={() => void reload()}
                />
                <RowTranslationsDisclosure
                  key={`${card.id}-${JSON.stringify(card.translations ?? {})}`}
                  translations={card.translations}
                  fields={[
                    { key: "label", label: "Label" },
                    { key: "value", label: "Value" },
                  ]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(card.id, {
                      translations: {
                        ...(card.translations ?? {}),
                        [locale]: { ...(card.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={card.active} onChange={(e) => void handleUpdate(card.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === cards.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(card.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Card</p>
        <Input placeholder="Label, mis. Minimum Order" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Card
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus quick card ini?"
          message="Kartu akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
