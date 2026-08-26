"use client";

import { Button, Card, cn, Input, Label } from "@ppn/ui-components";
import type { Locale, MoqPaymentBusinessTerm } from "@ppn/shared-types";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { ListToolbar, type ActiveFilter, type SortKey } from "@/components/admin/ListToolbar";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Fully open-ended label/value list — admin can add arbitrary custom terms beyond the 9
 * seeded defaults (e.g. "Incoterms", "Port of Loading") with no frontend code change. Term
 * Value is a single plain text field, not a dropdown — the list itself is the extensibility
 * mechanism, so no fixed enum is needed. */
export function MoqPaymentBusinessTermsEditor() {
  const fetchTerms = useCallback(
    () => adminApi.get<MoqPaymentBusinessTerm[]>("/admin/about-company/moq-payment-business-terms"),
    [],
  );
  const { data: terms, status, reload, retry } = useAdminResource(fetchTerms);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Defensive duplicate-order check — no DB constraint (reorder is drag/Naik/Turun only, so
  // this should only ever fire from a data race, not admin input), but warn rather than trust
  // silently if it ever does.
  useEffect(() => {
    if (!terms) return;
    const orders = terms.map((t) => t.order);
    if (new Set(orders).size !== orders.length) {
      showToast("Ditemukan urutan duplikat pada Business Terms — muat ulang halaman.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the list itself changes
  }, [terms]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newLabel.trim() || !newValue.trim()) {
      setError("Term Label dan Term Value wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/moq-payment-business-terms", {
        label: newLabel,
        value: newValue,
        order: terms?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewLabel("");
      setNewValue("");
      await reload();
      showToast("Business term ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah business term.");
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
      await adminApi.put(`/admin/about-company/moq-payment-business-terms/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/moq-payment-business-terms/${id}`);
      await reload();
      showToast("Business term dihapus.");
    } catch {
      showToast("Gagal menghapus business term. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!terms) return;
    if (to < 0 || to >= terms.length) return;
    const next = arrayMove(terms, from, to);
    try {
      await Promise.all(
        next
          .map((term, index) =>
            term.order === index
              ? null
              : adminApi.put(`/admin/about-company/moq-payment-business-terms/${term.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load business terms." onRetry={() => void retry()} />;

  if (status === "loading" || !terms) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={5} />
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = terms
    .map((term, index) => ({ term, index }))
    .filter(({ term }) => {
      if (activeFilter === "active" && !term.active) return false;
      if (activeFilter === "inactive" && term.active) return false;
      if (!query) return true;
      return term.label.toLowerCase().includes(query) || term.value.toLowerCase().includes(query);
    })
    .sort((a, b) => (sort === "name" ? a.term.label.localeCompare(b.term.label) : a.term.order - b.term.order));

  const reorderable = !query && activeFilter === "all" && sort === "order";

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Business Terms</h2>
      <p className="mt-1 text-small text-neutral-600">
        Daftar terbuka — tambahkan term apa saja (mis. Certificate, Incoterms, Port of Loading)
        tanpa perlu perubahan kode. {reorderable
          ? "Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun."
          : "Hapus filter/pencarian untuk mengubah urutan."}
      </p>

      {terms.length > 0 && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari label atau value..."
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          resultCount={visible.length}
          totalCount={terms.length}
        />
      )}

      <div className="mt-4 flex flex-col gap-3">
        {terms.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada business term.</p>
          </div>
        )}
        {terms.length > 0 && visible.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada term yang cocok dengan pencarian/filter.</p>
        )}
        {visible.map(({ term, index }) => {
          const rowProps = reorderable ? getRowProps(index) : { draggable: false, className: "" };
          return (
            <div
              key={term.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              {reorderable && (
                <span {...getHandleProps(index)} className="mt-7">
                  <DragHandle />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-small">Term Label *</Label>
                    <Input defaultValue={term.label} onBlur={(e) => void handleUpdate(term.id, { label: e.target.value }, "Term Label")} />
                  </div>
                  <div>
                    <Label className="text-small">Term Value *</Label>
                    <Input defaultValue={term.value} onBlur={(e) => void handleUpdate(term.id, { value: e.target.value }, "Term Value")} />
                  </div>
                </div>
                <GenerateTranslationsPanel
                  statusUrl={`/admin/about-company/moq-payment-business-terms/${term.id}/translation-status`}
                  generateUrl={`/admin/about-company/moq-payment-business-terms/${term.id}/translations/generate`}
                  onGenerated={() => void reload()}
                />
                <RowTranslationsDisclosure
                  key={`${term.id}-${JSON.stringify(term.translations ?? {})}`}
                  translations={term.translations}
                  fields={[
                    { key: "label", label: "Term Label" },
                    { key: "value", label: "Term Value" },
                  ]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(term.id, {
                      translations: {
                        ...(term.translations ?? {}),
                        [locale]: { ...(term.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={term.active} onChange={(e) => void handleUpdate(term.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === terms.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(term.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Term</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-term-label">Term Label</Label>
            <Input id="new-term-label" placeholder="mis. Incoterms" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="new-term-value">Term Value</Label>
            <Input id="new-term-value" placeholder="mis. FOB / CIF" value={newValue} onChange={(e) => setNewValue(e.target.value)} required />
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Term
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus business term ini?"
          message="Term akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
