"use client";

import type { AboutCompanyLegalSection, LegalDocumentCategory, Locale } from "@ppn/shared-types";
import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

/** Section copy + the CMS-managed document categories that replaced the fixed enum. */
export function LegalSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyLegalSection>("/admin/about-company/legal-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/legal-section", patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Changes could not be saved.", "error");
      await reload();
    }
  }

  if (status === "error") {
    return <AdminLoadError message="Failed to load legal section content." onRetry={() => void retry()} />;
  }
  if (status === "loading" || !section) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={3} />
      </div>
    );
  }

  async function handleUpdateTranslation(
    locale: Exclude<Locale, "en">,
    field: "eyebrow" | "heading" | "description",
    value: string,
  ) {
    const current = section?.translations ?? {};
    await handleUpdate({
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  return (
    <>
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Judul Section</h2>
        <p className="mt-1 text-small text-neutral-600">
          Teks pembuka section Legal &amp; Company Information. Tersimpan otomatis sebagai draf.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="legal-eyebrow">Eyebrow</Label>
              <Input
                id="legal-eyebrow"
                defaultValue={section.eyebrow}
                onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="legal-heading">Judul</Label>
              <Input
                id="legal-heading"
                defaultValue={section.heading}
                onBlur={(e) => void handleUpdate({ heading: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="legal-description">Deskripsi Pendukung</Label>
            <Textarea
              id="legal-description"
              rows={3}
              defaultValue={section.description}
              onBlur={(e) => void handleUpdate({ description: e.target.value })}
            />
          </div>

          <label className="flex items-start gap-2 rounded-field border border-neutral-200 p-3 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={section.hide_expired}
              onChange={(e) => void handleUpdate({ hide_expired: e.target.checked })}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Sembunyikan dokumen yang sudah kedaluwarsa dari halaman publik
              <span className="mt-0.5 block text-small text-neutral-500">
                Default: nonaktif. Dokumen kedaluwarsa tetap tampil (dengan label tanggalnya) kecuali Anda
                memilih menyembunyikannya — dokumennya sendiri tidak pernah dihapus.
              </span>
            </span>
          </label>

          <details className="border-t border-neutral-100 pt-4">
            <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
              🌐 Translations
              <TranslationStatusBadges
                translations={section.translations}
                base={{ eyebrow: section.eyebrow, heading: section.heading, description: section.description }}
              />
            </summary>
            <div className="mt-3">
              <GenerateTranslationsPanel
                statusUrl="/admin/about-company/legal-section/translation-status"
                generateUrl="/admin/about-company/legal-section/translations/generate"
                onGenerated={() => void reload()}
              />
              <LocaleTabs>
                {(locale) =>
                  locale === "en" ? (
                    <p className="text-small text-neutral-500">
                      Bahasa Inggris diedit langsung pada field-field di atas.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label className="text-small">Eyebrow</Label>
                        <Input
                          defaultValue={section.translations?.[locale]?.eyebrow ?? ""}
                          placeholder={section.eyebrow}
                          onBlur={(e) => void handleUpdateTranslation(locale, "eyebrow", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-small">Judul</Label>
                        <Input
                          defaultValue={section.translations?.[locale]?.heading ?? ""}
                          placeholder={section.heading}
                          onBlur={(e) => void handleUpdateTranslation(locale, "heading", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-small">Deskripsi Pendukung</Label>
                        <Textarea
                          rows={3}
                          defaultValue={section.translations?.[locale]?.description ?? ""}
                          placeholder={section.description}
                          onBlur={(e) => void handleUpdateTranslation(locale, "description", e.target.value)}
                        />
                      </div>
                      <p className="text-small text-neutral-500">
                        Kosongkan untuk memakai teks Inggris sebagai fallback.
                      </p>
                    </div>
                  )
                }
              </LocaleTabs>
            </div>
          </details>
        </div>
      </Card>

      <LegalCategoryManager />
    </>
  );
}

function LegalCategoryManager() {
  const fetchCategories = useCallback(
    () => adminApi.get<LegalDocumentCategory[]>("/admin/about-company/legal-categories"),
    [],
  );
  const { data: categories, status, reload, retry } = useAdminResource(fetchCategories);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/legal-categories", {
        name: newName,
        order: categories?.length ?? 0,
        active: true,
      });
      setNewName("");
      await reload();
      showToast("Kategori ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah kategori.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/legal-categories/${id}`, patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Changes could not be saved.", "error");
      await reload();
    }
  }

  async function handleUpdateTranslation(category: LegalDocumentCategory, locale: Exclude<Locale, "en">, value: string) {
    const current = category.translations ?? {};
    await handleUpdate(category.id, {
      translations: { ...current, [locale]: { ...current[locale], name: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/legal-categories/${id}`);
      await reload();
      showToast("Kategori dihapus. Dokumennya tetap ada, hanya tanpa kategori.");
    } catch {
      showToast("Gagal menghapus kategori. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!categories) return;
    if (to < 0 || to >= categories.length) return;
    const next = arrayMove(categories, from, to);
    try {
      await Promise.all(
        next
          .map((category, index) =>
            category.order === index
              ? null
              : adminApi.put(`/admin/about-company/legal-categories/${category.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan kategori.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Kategori Dokumen</h2>
      <p className="mt-1 text-small text-neutral-600">
        Kategori yang bisa dipilih tiap dokumen dan dipakai sebagai filter di halaman publik. Seret untuk
        mengubah urutan, atau gunakan Naik/Turun.
      </p>

      {status === "error" && <AdminLoadError message="Failed to load categories." onRetry={() => void retry()} />}
      {status === "loading" && (
        <div className="mt-4">
          <SkeletonCard rows={2} />
        </div>
      )}

      {status === "ready" && categories && (
        <div className="mt-4 flex flex-col gap-2">
          {categories.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
              <p className="text-body text-neutral-600">Belum ada kategori.</p>
            </div>
          )}
          {categories.map((category, index) => {
            const rowProps = getRowProps(index);
            return (
              <div
                key={category.id}
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
                  <Input
                    className="max-w-xs"
                    defaultValue={category.name}
                    onBlur={(e) => void handleUpdate(category.id, { name: e.target.value })}
                  />
                  <Badge variant="neutral">{category.slug}</Badge>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={category.active}
                      onChange={(e) => void handleUpdate(category.id, { active: e.target.checked })}
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
                    disabled={index === categories.length - 1}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(category.id)}
                    className="ml-auto text-small text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>

                <details className="mt-2">
                  <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                    🌐 Translations
                    <TranslationStatusBadges translations={category.translations} base={{ name: category.name }} />
                  </summary>
                  <div className="mt-2 max-w-xs">
                    <GenerateTranslationsPanel
                      statusUrl={`/admin/about-company/legal-categories/${category.id}/translation-status`}
                      generateUrl={`/admin/about-company/legal-categories/${category.id}/translations/generate`}
                      onGenerated={() => void reload()}
                    />
                    <LocaleTabs>
                      {(locale) =>
                        locale === "en" ? (
                          <p className="text-small text-neutral-500">
                            Bahasa Inggris diedit langsung pada field nama di atas.
                          </p>
                        ) : (
                          <div>
                            <Label className="text-small">Nama</Label>
                            <Input
                              defaultValue={category.translations?.[locale]?.name ?? ""}
                              placeholder={category.name}
                              onBlur={(e) => void handleUpdateTranslation(category, locale, e.target.value)}
                            />
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
      )}

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div className="min-w-[16rem] flex-1">
          <Label htmlFor="new-category-name">+ Tambah Kategori</Label>
          <Input
            id="new-category-name"
            value={newName}
            placeholder="mis. Export Documents"
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <Button type="submit">Tambah</Button>
        {error && <p className="w-full text-small text-red-600">{error}</p>}
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus kategori ini?"
          message="Dokumen yang memakai kategori ini tidak ikut terhapus — dokumennya tetap ada dan hanya kehilangan kategorinya."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
