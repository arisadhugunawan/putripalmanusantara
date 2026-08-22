"use client";

import type { WhoWeSupplyItem } from "@ppn/shared-types";
import { WHO_WE_SUPPLY_ICONS } from "@ppn/shared-types";
import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/**
 * "Who We Supply" audience segments — a short, flat repeatable list (Importers/Manufacturers/
 * Distributors/Industrial Users/Long-term Partners by default), fully Admin-managed.
 */
export function WhoWeSupplyEditor() {
  const fetchItems = useCallback(
    () => adminApi.get<WhoWeSupplyItem[]>("/admin/about-company/who-we-supply-items"),
    [],
  );
  const { data: items, status, reload, retry } = useAdminResource(fetchItems);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newTitle.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/who-we-supply-items", {
        title: newTitle,
        description: newDescription,
        icon: newIcon || undefined,
        order: items?.length ?? 0,
        active: true,
      });
      setNewTitle("");
      setNewDescription("");
      setNewIcon("");
      await reload();
      showToast("Segmen berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah segmen.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/who-we-supply-items/${id}`, patch);
      await reload();
    } catch {
      showToast("Changes could not be saved. Please try again.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/who-we-supply-items/${id}`);
      await reload();
      showToast("Segmen berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus segmen. Silakan coba lagi.", "error");
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
              : adminApi.put(`/admin/about-company/who-we-supply-items/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Who We Supply — Segmen Audiens</h2>
      <p className="mt-1 text-small text-neutral-600">
        Kartu segmen (Importers, Manufacturers, dst.) yang tampil sebagai alur horizontal di halaman publik. Seret
        kartu untuk mengubah urutan, atau gunakan Naik/Turun.
      </p>

      {status === "error" && (
        <AdminLoadError message="Failed to load segments." onRetry={() => void retry()} />
      )}

      {status === "loading" && (
        <div className="mt-4">
          <SkeletonListRows rows={2} />
        </div>
      )}

      {status === "ready" && items && (
        <div className="mt-5 flex flex-col gap-3">
          {items.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-body text-neutral-600">Belum ada segmen audiens.</p>
              <p className="mt-1 text-small text-neutral-500">Gunakan formulir “+ Add Segment” di bawah.</p>
            </div>
          )}
          {items.map((item, index) => {
            const rowProps = getRowProps(index);
            return (
              <div
                key={item.id}
                {...rowProps}
                className={cn(
                  "rounded-field border border-neutral-200 p-3 transition-opacity",
                  rowProps.className,
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span {...getHandleProps(index)}>
                    <DragHandle />
                  </span>
                  <Badge variant={item.active ? "primary" : "neutral"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-small text-neutral-500">
                    Order {String(index + 1).padStart(2, "0")}
                  </span>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(e) => void handleUpdate(item.id, { active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Aktif
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index - 1)}
                    disabled={index === 0}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(item.id)}
                    className="ml-auto text-small text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr_9rem]">
                  <div>
                    <Label className="text-small">Judul</Label>
                    <Input
                      defaultValue={item.title}
                      onBlur={(e) => void handleUpdate(item.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Deskripsi</Label>
                    <Textarea
                      rows={2}
                      defaultValue={item.description}
                      onBlur={(e) => void handleUpdate(item.id, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Ikon</Label>
                    <select
                      defaultValue={item.icon ?? ""}
                      onChange={(e) => void handleUpdate(item.id, { icon: e.target.value || null })}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2.5 text-body"
                    >
                      <option value="">Tanpa ikon</option>
                      {WHO_WE_SUPPLY_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Segment</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr_9rem]">
          <div>
            <Label htmlFor="new-who-title">Judul</Label>
            <Input
              id="new-who-title"
              value={newTitle}
              placeholder="mis. Importers"
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-who-description">Deskripsi</Label>
            <Input
              id="new-who-description"
              value={newDescription}
              placeholder="mis. International coconut product importers."
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-who-icon">Ikon</Label>
            <select
              id="new-who-icon"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-full rounded-field border border-neutral-300 px-3 py-2.5 text-body"
            >
              <option value="">Tanpa ikon</option>
              {WHO_WE_SUPPLY_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Segment
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Delete this item?"
          message="This action cannot be undone."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
