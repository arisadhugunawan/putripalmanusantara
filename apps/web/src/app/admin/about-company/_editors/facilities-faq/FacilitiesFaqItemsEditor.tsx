"use client";

import { Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { FacilitiesFaqItem, Locale } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
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

const ICON_OPTIONS = [
  { value: "", label: "None (default)" },
  { value: "help-circle", label: "Help Circle" },
  { value: "question-circle", label: "Question Circle" },
  { value: "info", label: "Info" },
  { value: "package", label: "Package" },
  { value: "ship", label: "Ship" },
  { value: "map-pin", label: "Map Pin" },
];

/** The 10-question FAQ list. `category`/`featured` are stored admin metadata with no current
 * frontend display (documented to the admin via the hint text below) — the brief asks for
 * these fields but describes no visual behavior for either. Each row also manages its own
 * nested product-tag list (only shown under FAQ 01 by default, but any item can carry tags). */
export function FacilitiesFaqItemsEditor() {
  const fetchItems = useCallback(
    () => adminApi.get<FacilitiesFaqItem[]>("/admin/about-company/facilities-faq-items"),
    [],
  );
  const { data: items, status, reload, retry } = useAdminResource(fetchItems);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setError("Question dan Answer wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/facilities-faq-items", {
        question: newQuestion,
        answer: newAnswer,
        order: items?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewQuestion("");
      setNewAnswer("");
      await reload();
      showToast("FAQ ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah FAQ.");
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
      await adminApi.put(`/admin/about-company/facilities-faq-items/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/facilities-faq-items/${id}`);
      await reload();
      showToast("FAQ dihapus.");
    } catch {
      showToast("Gagal menghapus FAQ. Silakan coba lagi.", "error");
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
              : adminApi.put(`/admin/about-company/facilities-faq-items/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load FAQ items." onRetry={() => void retry()} />;

  if (status === "loading" || !items) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={10} />
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
      return item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query);
    })
    .sort((a, b) => (sort === "name" ? a.item.question.localeCompare(b.item.question) : a.item.order - b.item.order));

  const reorderable = !query && activeFilter === "all" && sort === "order";

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">FAQ Management</h2>
      <p className="mt-1 text-small text-neutral-600">
        10 pertanyaan yang ditampilkan di accordion halaman publik. Category dan Featured adalah
        metadata admin — belum ditampilkan di frontend. {reorderable
          ? "Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun."
          : "Hapus filter/pencarian untuk mengubah urutan."}
      </p>

      {items.length > 0 && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari question atau answer..."
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
            <p className="text-body text-neutral-600">Belum ada FAQ.</p>
          </div>
        )}
        {items.length > 0 && visible.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada FAQ yang cocok dengan pencarian/filter.</p>
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
                <div>
                  <Label className="text-small">Question *</Label>
                  <Input defaultValue={item.question} onBlur={(e) => void handleUpdate(item.id, { question: e.target.value }, "Question")} />
                </div>
                <div className="mt-2">
                  <Label className="text-small">Answer *</Label>
                  <Textarea rows={3} defaultValue={item.answer} onBlur={(e) => void handleUpdate(item.id, { answer: e.target.value }, "Answer")} />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="text-small">Category (opsional)</Label>
                    <Input defaultValue={item.category} onBlur={(e) => void handleUpdate(item.id, { category: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-small">Icon (opsional)</Label>
                    <select
                      defaultValue={item.icon ?? ""}
                      onChange={(e) => void handleUpdate(item.id, { icon: e.target.value || null })}
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
                    <Label className="text-small">Highlight Text (opsional)</Label>
                    <Input
                      defaultValue={item.highlight_text ?? ""}
                      placeholder="mis. ≈ 15 CONTAINERS / WEEK"
                      onBlur={(e) => void handleUpdate(item.id, { highlight_text: e.target.value || null })}
                    />
                    <p className="mt-1 text-small text-neutral-500">Kosong = tidak ditampilkan.</p>
                  </div>
                </div>
                <GenerateTranslationsPanel
                  statusUrl={`/admin/about-company/facilities-faq-items/${item.id}/translation-status`}
                  generateUrl={`/admin/about-company/facilities-faq-items/${item.id}/translations/generate`}
                  onGenerated={() => void reload()}
                />
                <RowTranslationsDisclosure
                  key={`${item.id}-${JSON.stringify(item.translations ?? {})}`}
                  translations={item.translations}
                  fields={[
                    { key: "question", label: "Question" },
                    { key: "answer", label: "Answer" },
                    { key: "highlightText", label: "Highlight Text" },
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
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={item.featured} onChange={(e) => void handleUpdate(item.id, { featured: e.target.checked })} className="h-4 w-4" />
                    Featured
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

                <FaqItemProductTagsSection item={item} onReload={reload} />
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add FAQ</p>
        <div>
          <Label htmlFor="new-faq-question">Question</Label>
          <Input id="new-faq-question" placeholder="mis. What products does PPN supply?" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="new-faq-answer">Answer</Label>
          <Textarea id="new-faq-answer" rows={3} value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add FAQ
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus FAQ ini?"
          message="FAQ akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

/** Nested product-tags manager for one FAQ item — mirrors `FacilityGallerySection`'s pattern
 * inside `FacilitiesEditor.tsx` (reads nested data straight off the parent row, calls the
 * parent's `onReload` after any mutation so the nested list stays in sync). No drag-reorder —
 * tag lists are short (rarely more than 4-5), so Naik/Turun alone is plenty. */
function FaqItemProductTagsSection({
  item,
  onReload,
}: {
  item: FacilitiesFaqItem;
  onReload: () => Promise<void>;
}) {
  const [newTagName, setNewTagName] = useState("");
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleAddTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!newTagName.trim()) return;
    try {
      await adminApi.post("/admin/about-company/facilities-faq-tags", {
        faq_item_id: item.id,
        name: newTagName,
        order: item.tags.length,
        active: true,
      });
      form.reset();
      setNewTagName("");
      await onReload();
    } catch {
      showToast("Gagal menambah product tag.", "error");
    }
  }

  async function handleUpdateTag(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/facilities-faq-tags/${id}`, patch);
      await onReload();
    } catch {
      showToast("Gagal menyimpan perubahan tag.", "error");
    }
  }

  async function handleDeleteTag() {
    if (!deleteTagId) return;
    const id = deleteTagId;
    setDeleteTagId(null);
    try {
      await adminApi.delete(`/admin/about-company/facilities-faq-tags/${id}`);
      await onReload();
    } catch {
      showToast("Gagal menghapus tag.", "error");
    }
  }

  async function handleReorderTag(from: number, to: number) {
    if (to < 0 || to >= item.tags.length) return;
    const next = arrayMove(item.tags, from, to);
    try {
      await Promise.all(
        next
          .map((tag, index) =>
            tag.order === index
              ? null
              : adminApi.put(`/admin/about-company/facilities-faq-tags/${tag.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await onReload();
    } catch {
      showToast("Gagal memperbarui urutan tag.", "error");
    }
  }

  return (
    <div className="mt-3 rounded-field border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-small font-medium uppercase tracking-wide text-neutral-500">
        Product Tags ({item.tags.length})
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {item.tags.map((tag, index) => (
          <div key={tag.id} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                defaultValue={tag.name}
                onBlur={(e) => void handleUpdateTag(tag.id, { name: e.target.value })}
                className="max-w-xs"
              />
              <label className="flex items-center gap-1 text-small text-neutral-600">
                <input type="checkbox" checked={tag.active} onChange={(e) => void handleUpdateTag(tag.id, { active: e.target.checked })} className="h-4 w-4" />
                Aktif
              </label>
              <button type="button" onClick={() => void handleReorderTag(index, index - 1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                Naik
              </button>
              <button
                type="button"
                onClick={() => void handleReorderTag(index, index + 1)}
                disabled={index === item.tags.length - 1}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Turun
              </button>
              <button type="button" onClick={() => setDeleteTagId(tag.id)} className="text-small text-red-600 underline">
                Hapus
              </button>
            </div>
            <details>
              <summary className="cursor-pointer text-small font-medium text-neutral-700">🌐 Translations</summary>
              <div className="mt-2 max-w-xs">
                <GenerateTranslationsPanel
                  statusUrl={`/admin/about-company/facilities-faq-tags/${tag.id}/translation-status`}
                  generateUrl={`/admin/about-company/facilities-faq-tags/${tag.id}/translations/generate`}
                  onGenerated={() => void onReload()}
                />
              </div>
            </details>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddTag} className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          placeholder="mis. Semi Husked Coconut"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary" className="text-small">
          + Add Tag
        </Button>
      </form>

      {deleteTagId && (
        <ConfirmDialog
          title="Hapus product tag ini?"
          message="Tag akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDeleteTag()}
          onCancel={() => setDeleteTagId(null)}
        />
      )}
    </div>
  );
}
