"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import { getMediaPolicy } from "@ppn/shared-types";
import type { Locale, ProductDetail, WhatWeDoItem } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ListToolbar, type ActiveFilter, type SortKey } from "@/components/admin/ListToolbar";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SkeletonCard, SkeletonListRows } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_MEDIA_BYTES = getMediaPolicy("general").maxBytes;

export function WhatWeDoEditor() {
  const fetchItems = useCallback(
    () => adminApi.get<WhatWeDoItem[]>("/admin/about-company/what-we-do-items"),
    [],
  );
  const { data: items, status, reload, retry } = useAdminResource(fetchItems);
  // Product list for the optional "link to product" picker — best-effort, since a failure
  // should not stop the Admin from editing the activities themselves.
  const fetchProducts = useCallback(
    () => adminApi.get<ProductDetail[]>("/admin/products").catch(() => [] as ProductDetail[]),
    [],
  );
  const { data: products } = useAdminResource(fetchProducts);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newMediaId, setNewMediaId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newTitle.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/what-we-do-items", {
        title: newTitle,
        media_id: newMediaId ?? undefined,
        order: items?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewTitle("");
      setNewMediaId(null);
      await reload();
      showToast("Aktivitas berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah aktivitas.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/what-we-do-items/${id}`, patch);
      await reload();
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  async function handleUpdateTranslation(item: WhatWeDoItem, locale: Exclude<Locale, "en">, value: string) {
    const current = item.translations ?? {};
    await handleUpdate(item.id, {
      translations: { ...current, [locale]: { ...current[locale], title: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/what-we-do-items/${id}`);
      await reload();
      showToast("Aktivitas berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus aktivitas. Silakan coba lagi.", "error");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/about-company/what-we-do-items/${id}/duplicate`);
      await reload();
      showToast("Aktivitas diduplikasi sebagai draf nonaktif.");
    } catch {
      showToast("Gagal menduplikasi aktivitas. Silakan coba lagi.", "error");
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
              : adminApi.put(`/admin/about-company/what-we-do-items/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load activities." onRetry={() => void retry()} />;

  if (status === "loading" || !items) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={0} />
        <div className="mt-4">
          <SkeletonListRows rows={3} />
        </div>
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
      return (
        item.title.toLowerCase().includes(query) ||
        item.short_description.toLowerCase().includes(query) ||
        item.detailed_description.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (sort === "name" ? a.item.title.localeCompare(b.item.title) : a.item.order - b.item.order));

  const reorderable = !query && activeFilter === "all" && sort === "order";

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Product Cards</h2>
      <p className="mt-1 text-small text-neutral-600">
        Kartu produk yang tampil di section &ldquo;What We Supply&rdquo;.{" "}
        {reorderable ? "Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun." : "Hapus filter/pencarian untuk mengubah urutan."}
      </p>

      {items.length > 0 && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari judul atau deskripsi..."
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          resultCount={visible.length}
          totalCount={items.length}
        />
      )}

      <div className="mt-4 flex flex-col gap-4">
        {items.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada aktivitas yang ditambahkan.</p>
            <p className="mt-1 text-small text-neutral-500">Gunakan formulir “+ Add Activity” di bawah.</p>
          </div>
        )}
        {items.length > 0 && visible.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada aktivitas yang cocok dengan pencarian/filter.</p>
        )}
        {visible.map(({ item, index }) => {
          const rowProps = reorderable ? getRowProps(index) : { draggable: false, className: "" };
          return (
            <div
              key={item.id}
              {...rowProps}
              className={cn("rounded-field border border-neutral-200 p-4 transition-opacity", rowProps.className)}
            >
              <div className="flex flex-wrap items-start gap-3">
                {reorderable && (
                  <span {...getHandleProps(index)} className={cn("mt-5", getHandleProps(index).className)}>
                    <DragHandle />
                  </span>
                )}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-50">
                  {item.media ? (
                    <Image src={item.media.file_url} alt={item.media.alt_text} fill sizes="64px" className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-small text-neutral-400">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-neutral-900">
                    {String(index + 1).padStart(2, "0")}. {item.title}
                  </p>
                  <p className="line-clamp-1 text-small text-neutral-500">{item.short_description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={item.active ? "primary" : "neutral"}>{item.active ? "Active" : "Inactive"}</Badge>
                    {item.featured && <Badge variant="primary">★ Featured</Badge>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={item.active} onChange={(e) => void handleUpdate(item.id, { active: e.target.checked })} className="h-4 w-4" />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={item.featured} onChange={(e) => void handleUpdate(item.id, { featured: e.target.checked })} className="h-4 w-4" />
                  Featured
                </label>
                <button type="button" onClick={() => void handleDuplicate(item.id)} className="text-small text-neutral-600 underline">
                  Duplicate
                </button>
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
                <button type="button" onClick={() => setDeleteTargetId(item.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-small">Judul</Label>
                  <Input defaultValue={item.title} onBlur={(e) => void handleUpdate(item.id, { title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Deskripsi Singkat</Label>
                  <Textarea rows={2} defaultValue={item.short_description} onBlur={(e) => void handleUpdate(item.id, { short_description: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Deskripsi Detail (opsional)</Label>
                  <Textarea rows={3} defaultValue={item.detailed_description} onBlur={(e) => void handleUpdate(item.id, { detailed_description: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Key Points (satu poin per baris, opsional)</Label>
                  <Textarea
                    rows={3}
                    defaultValue={item.key_points.join("\n")}
                    placeholder={"Export-oriented fresh coconut\nFlexible sourcing\nSorted by size and quality"}
                    onBlur={(e) =>
                      void handleUpdate(item.id, {
                        key_points: e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-small">Tautan ke Produk (opsional)</Label>
                  <select
                    defaultValue={item.product?.id ?? ""}
                    onChange={(e) => void handleUpdate(item.id, { product_id: e.target.value || null })}
                    className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
                  >
                    <option value="">Tidak ditautkan</option>
                    {products?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-small text-neutral-500">
                    Dipilih dari katalog produk yang sungguh ada — tautannya dibangun dari slug produk saat
                    dirender, jadi tidak akan pernah jadi tautan mati.
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <MediaUploadField
                  label="Gambar / Ikon"
                  media={item.media}
                  onChange={(media) => void handleUpdate(item.id, { media_id: media.id })}
                  onRemove={() => void handleUpdate(item.id, { media_id: null })}
                  maxSizeBytes={MAX_MEDIA_BYTES}
                  hint="Gunakan salah satu: gambar (rekomendasi 1200×900px) atau ikon SVG/PNG. Maksimum 5MB."
                  previewFit="contain"
                />
              </div>

              <details className="mt-3 border-t border-neutral-100 pt-3">
                <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                  🌐 Translations
                  <TranslationStatusBadges translations={item.translations} base={{ title: item.title }} />
                </summary>
                <div className="mt-3">
                  <LocaleTabs>
                    {(locale) =>
                      locale === "en" ? (
                        <p className="text-small text-neutral-500">
                          Bahasa Inggris diedit langsung pada field Judul di atas.
                        </p>
                      ) : (
                        <div>
                          <Label className="text-small">Judul</Label>
                          <Input
                            defaultValue={item.translations?.[locale]?.title ?? ""}
                            placeholder={item.title}
                            onBlur={(e) => void handleUpdateTranslation(item, locale, e.target.value)}
                          />
                          <p className="mt-1 text-small text-neutral-500">
                            Kosongkan untuk memakai teks Inggris sebagai fallback. Deskripsi singkat &amp; detail
                            tidak tampil di halaman publik saat ini, jadi tidak diterjemahkan di sini.
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
        <p className="text-small font-medium text-neutral-900">+ Add Activity</p>
        <MediaUploadField
          label="Gambar / Ikon (opsional)"
          media={null}
          onChange={(media) => setNewMediaId(media.id)}
          maxSizeBytes={MAX_MEDIA_BYTES}
          previewFit="contain"
        />
        <div>
          <Label htmlFor="new-activity-title">Judul</Label>
          <Input id="new-activity-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Activity
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus aktivitas ini?"
          message="Kartu aktivitas ini akan dihapus dan tidak akan tampil di halaman About Company."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
