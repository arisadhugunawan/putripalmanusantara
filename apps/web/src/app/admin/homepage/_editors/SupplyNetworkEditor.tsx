"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { Locale, SupplyNetworkIcon, SupplyNetworkItem, SupplyNetworkPosition } from "@ppn/shared-types";
import {
  SUPPLY_NETWORK_ICON_LABELS,
  SUPPLY_NETWORK_ICON_KEYS,
  SUPPLY_NETWORK_POSITION_LABELS,
  SUPPLY_NETWORK_POSITIONS,
} from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

const ICON_OPTIONS = SUPPLY_NETWORK_ICON_KEYS.map((value) => ({
  value,
  label: SUPPLY_NETWORK_ICON_LABELS[value],
}));

const POSITION_OPTIONS = SUPPLY_NETWORK_POSITIONS.map((value) => ({
  value,
  label: SUPPLY_NETWORK_POSITION_LABELS[value],
}));

export function SupplyNetworkEditor() {
  const [items, setItems] = useState<SupplyNetworkItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newShortTitle, setNewShortTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState<SupplyNetworkIcon>("farmer");
  const [newPosition, setNewPosition] = useState<SupplyNetworkPosition>("top");
  const [newIllustrationId, setNewIllustrationId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<SupplyNetworkItem[]>("/admin/supply-network");
    setItems(data);
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
      await adminApi.post("/admin/supply-network", {
        label: newLabel,
        title: newTitle,
        short_title: newShortTitle,
        description: newDescription,
        icon: newIcon,
        position: newPosition,
        illustration_id: newIllustrationId ?? undefined,
        order: items?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewLabel("");
      setNewTitle("");
      setNewShortTitle("");
      setNewDescription("");
      setNewIcon("farmer");
      setNewPosition("top");
      setNewIllustrationId(null);
      await load();
      showToast("Item supply network berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah item supply network.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/supply-network/${id}`, patch);
      await load();
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleUpdateTranslation(
    item: SupplyNetworkItem,
    locale: Exclude<Locale, "en">,
    field: "title" | "shortTitle" | "description",
    value: string,
  ) {
    const current = item.translations ?? {};
    await handleUpdate(item.id, {
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/supply-network/${id}`);
      await load();
      showToast("Item supply network berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus item supply network. Silakan coba lagi.", "error");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/supply-network/${id}/duplicate`);
      await load();
      showToast("Item supply network berhasil diduplikasi.");
    } catch {
      showToast("Gagal menduplikasi item supply network. Silakan coba lagi.", "error");
    }
  }

  /** Rewrites the whole sequence rather than swapping two items — shared by drag-and-drop and
   * the Naik/Turun buttons so the two paths can never disagree about the resulting order. */
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
              : adminApi.put(`/admin/supply-network/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await load();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  const filtered = items?.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Node Jaringan Supply</h2>
      <p className="mt-1 text-small text-neutral-600">
        Nomor node (01, 02, ...) dihitung otomatis dari urutan dan menentukan posisinya di
        sekeliling pusat PPN. Gunakan tab <strong>Connections</strong> di bawah untuk mengatur
        alur panah/partikel antar node. Seret kartu untuk mengubah urutan, atau gunakan
        Naik/Turun.
      </p>

      {items && items.length > 0 && (
        <div className="mt-4">
          <Input placeholder="Cari label, judul, atau deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {items?.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada node supply network yang ditambahkan.</p>
          </div>
        )}
        {items && items.length > 0 && filtered?.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada item yang cocok dengan pencarian.</p>
        )}
        {filtered?.map((item) => {
          const index = items!.findIndex((i) => i.id === item.id);
          // Handles are disabled while a search/filter is active — dragging a filtered row
          // would reorder against positions the Admin can't currently see.
          const reorderable = !search.trim();
          const rowProps = reorderable ? getRowProps(index) : { draggable: false, className: "" };
          return (
            <div
              key={item.id}
              {...rowProps}
              className={cn("rounded-field border border-neutral-200 p-4 transition-opacity", rowProps.className)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {reorderable && (
                    <span {...getHandleProps(index)}>
                      <DragHandle />
                    </span>
                  )}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-small font-semibold text-primary-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-body font-medium text-neutral-900">{item.title}</p>
                    <p className="text-small text-neutral-500">{item.label || "(tanpa label)"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.active ? "primary" : "neutral"}>{item.active ? "Active" : "Inactive"}</Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={item.active} onChange={(e) => void handleUpdate(item.id, { active: e.target.checked })} className="h-4 w-4" />
                  Aktif
                </label>
                <button type="button" onClick={() => void handleDuplicate(item.id)} className="text-small text-neutral-600 underline">
                  Duplicate
                </button>
                <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleReorder(index, index + 1)}
                  disabled={index === items!.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(item.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-small">Eyebrow / Label</Label>
                  <Input defaultValue={item.label} onBlur={(e) => void handleUpdate(item.id, { label: e.target.value })} placeholder="mis. DIRECT FARMERS" />
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
                <div>
                  <Label className="text-small">Title</Label>
                  <Input defaultValue={item.title} onBlur={(e) => void handleUpdate(item.id, { title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Short Title</Label>
                  <Input
                    defaultValue={item.short_title}
                    placeholder="mis. Local Farmer Network"
                    onBlur={(e) => void handleUpdate(item.id, { short_title: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-small">Description</Label>
                  <Textarea rows={2} defaultValue={item.description} onBlur={(e) => void handleUpdate(item.id, { description: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Position</Label>
                  <select
                    defaultValue={item.position}
                    onChange={(e) => void handleUpdate(item.id, { position: e.target.value })}
                    className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                  >
                    {POSITION_OPTIONS.map((position) => (
                      <option key={position.value} value={position.value}>
                        {position.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-small">CTA Label (opsional)</Label>
                  <Input defaultValue={item.cta_label ?? ""} onBlur={(e) => void handleUpdate(item.id, { cta_label: e.target.value || null })} />
                </div>
                <div>
                  <Label className="text-small">CTA Link (opsional)</Label>
                  <Input defaultValue={item.cta_href ?? ""} onBlur={(e) => void handleUpdate(item.id, { cta_href: e.target.value || null })} placeholder="/contact" />
                </div>
              </div>

              <div className="mt-3">
                <MediaUploadField
                  label="Image (opsional)"
                  media={item.illustration}
                  onChange={(media) => void handleUpdate(item.id, { illustration_id: media.id })}
                  onRemove={() => void handleUpdate(item.id, { illustration_id: null })}
                  hint="Rekomendasi: 1200×800px. Jika kosong, node ini tampil dengan ikon saja."
                  previewFit="cover"
                />
              </div>

              <details className="mt-3 border-t border-neutral-100 pt-3">
                <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                  🌐 Translations
                  <TranslationStatusBadges
                    translations={item.translations}
                    base={{ title: item.title, shortTitle: item.short_title, description: item.description }}
                  />
                </summary>
                <div className="mt-3">
                  <LocaleTabs>
                    {(locale) =>
                      locale === "en" ? (
                        <p className="text-small text-neutral-500">
                          Bahasa Inggris diedit langsung pada field Title/Short Title/Description di atas.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="text-small">Title</Label>
                            <Input
                              defaultValue={item.translations?.[locale]?.title ?? ""}
                              placeholder={item.title}
                              onBlur={(e) => void handleUpdateTranslation(item, locale, "title", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-small">Short Title</Label>
                            <Input
                              defaultValue={item.translations?.[locale]?.shortTitle ?? ""}
                              placeholder={item.short_title}
                              onBlur={(e) =>
                                void handleUpdateTranslation(item, locale, "shortTitle", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-small">Description</Label>
                            <Textarea
                              rows={2}
                              defaultValue={item.translations?.[locale]?.description ?? ""}
                              placeholder={item.description}
                              onBlur={(e) =>
                                void handleUpdateTranslation(item, locale, "description", e.target.value)
                              }
                            />
                          </div>
                          <p className="text-small text-neutral-500">
                            Kosongkan untuk memakai teks Inggris sebagai fallback. Eyebrow/Label tidak tampil di
                            halaman publik saat ini, jadi tidak diterjemahkan di sini.
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
        <p className="text-small font-medium text-neutral-900">+ Add Network Item</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-sn-label">Eyebrow / Label</Label>
            <Input id="new-sn-label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="mis. DIRECT FARMERS" />
          </div>
          <div>
            <Label htmlFor="new-sn-icon">Ikon</Label>
            <select
              id="new-sn-icon"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value as SupplyNetworkIcon)}
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-sn-title">Title</Label>
            <Input id="new-sn-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="new-sn-short-title">Short Title</Label>
            <Input
              id="new-sn-short-title"
              value={newShortTitle}
              onChange={(e) => setNewShortTitle(e.target.value)}
              placeholder="mis. Local Farmer Network"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="new-sn-description">Description</Label>
          <Textarea id="new-sn-description" rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="new-sn-position">Position</Label>
          <select
            id="new-sn-position"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value as SupplyNetworkPosition)}
            className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
          >
            {POSITION_OPTIONS.map((position) => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </select>
        </div>
        <MediaUploadField
          label="Image (opsional)"
          media={null}
          onChange={(media) => setNewIllustrationId(media.id)}
          hint="Rekomendasi: 1200×800px."
          previewFit="cover"
        />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Network Item
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus item supply network ini?"
          message="Item akan dihapus dan tidak akan tampil di section Our Supply Network. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
