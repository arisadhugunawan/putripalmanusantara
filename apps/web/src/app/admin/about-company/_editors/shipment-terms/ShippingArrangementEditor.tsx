"use client";

import { Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { Locale, ShippingArrangementItem } from "@ppn/shared-types";
import { SHIPMENT_ICON_KEYS, SHIPMENT_ICON_LABELS } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ListToolbar, type ActiveFilter, type SortKey } from "@/components/admin/ListToolbar";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const ICON_OPTIONS = SHIPMENT_ICON_KEYS.map((value) => ({ value, label: SHIPMENT_ICON_LABELS[value] }));

/** The 7-item "Shipping Arrangement" list — powers both the route journey labels and the
 * Information Cards grid on the public page. Independent free text, not derived from the
 * deeper Loading Locations/Container Types/Schedule/Documents lists below it. */
export function ShippingArrangementEditor() {
  const fetchItems = useCallback(
    () => adminApi.get<ShippingArrangementItem[]>("/admin/about-company/shipping-arrangement-items"),
    [],
  );
  const { data: items, status, reload, retry } = useAdminResource(fetchItems);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newTitle.trim() || !newValue.trim()) {
      setError("Title dan Value wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/shipping-arrangement-items", {
        title: newTitle,
        value: newValue,
        order: items?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewTitle("");
      setNewValue("");
      await reload();
      showToast("Shipping arrangement item ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah item.");
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
      await adminApi.put(`/admin/about-company/shipping-arrangement-items/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/shipping-arrangement-items/${id}`);
      await reload();
      showToast("Item dihapus.");
    } catch {
      showToast("Gagal menghapus item. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!items) return;
    if (to < 0 || to >= items.length) return;
    const next = arrayMove(items, from, to);
    try {
      await Promise.all(
        next
          .map((item, index) =>
            item.order === index
              ? null
              : adminApi.put(`/admin/about-company/shipping-arrangement-items/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load shipping arrangement items." onRetry={() => void retry()} />;

  if (status === "loading" || !items) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={7} />
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (activeFilter === "active" && !item.active) return false;
      if (activeFilter === "inactive" && item.active) return false;
      if (!query) return true;
      return item.title.toLowerCase().includes(query) || item.value.toLowerCase().includes(query);
    })
    .sort((a, b) => (sort === "name" ? a.item.title.localeCompare(b.item.title) : a.item.order - b.item.order));

  const reorderable = !query && activeFilter === "all" && sort === "order";

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Shipping Arrangement</h2>
      <p className="mt-1 text-small text-neutral-600">
        7 item ringkas yang mendasari label &quot;journey&quot; dan grid Information Cards di
        halaman publik. {reorderable ? "Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun." : "Hapus filter/pencarian untuk mengubah urutan."}
      </p>

      {items.length > 0 && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari title atau value..."
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          resultCount={visible.length}
          totalCount={items.length}
        />
      )}

      <div className="mt-4 flex flex-col gap-3">
        {items.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada shipping arrangement item.</p>
          </div>
        )}
        {items.length > 0 && visible.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada item yang cocok dengan pencarian/filter.</p>
        )}
        {visible.map(({ item, index }) => {
          const rowProps = reorderable ? getRowProps(index) : { draggable: false, className: "" };
          return (
            <div
              key={item.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              {reorderable && (
                <span {...getHandleProps(index)} className="mt-7">
                  <DragHandle />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="text-small">Title *</Label>
                    <Input defaultValue={item.title} onBlur={(e) => void handleUpdate(item.id, { title: e.target.value }, "Title")} />
                  </div>
                  <div>
                    <Label className="text-small">Value *</Label>
                    <Input defaultValue={item.value} onBlur={(e) => void handleUpdate(item.id, { value: e.target.value }, "Value")} />
                  </div>
                  <div>
                    <Label className="text-small">Ikon</Label>
                    <select
                      defaultValue={item.icon}
                      onChange={(e) => void handleUpdate(item.id, { icon: e.target.value })}
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
                  <Textarea
                    rows={2}
                    defaultValue={item.description}
                    onBlur={(e) => void handleUpdate(item.id, { description: e.target.value })}
                  />
                </div>
                <GenerateTranslationsPanel
                  statusUrl={`/admin/about-company/shipping-arrangement-items/${item.id}/translation-status`}
                  generateUrl={`/admin/about-company/shipping-arrangement-items/${item.id}/translations/generate`}
                  onGenerated={() => void reload()}
                />
                <RowTranslationsDisclosure
                  key={`${item.id}-${JSON.stringify(item.translations ?? {})}`}
                  translations={item.translations}
                  fields={[
                    { key: "title", label: "Title" },
                    { key: "value", label: "Value" },
                    { key: "description", label: "Description" },
                  ]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(item.id, {
                      translations: {
                        ...(item.translations ?? {}),
                        [locale]: { ...(item.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={item.active} onChange={(e) => void handleUpdate(item.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(item.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Shipping Information</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-arrangement-title">Title</Label>
            <Input id="new-arrangement-title" placeholder="mis. Shipment Terms" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="new-arrangement-value">Value</Label>
            <Input id="new-arrangement-value" placeholder="mis. FOB / By Mutual Agreement" value={newValue} onChange={(e) => setNewValue(e.target.value)} required />
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Shipping Information
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus item ini?"
          message="Item akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
