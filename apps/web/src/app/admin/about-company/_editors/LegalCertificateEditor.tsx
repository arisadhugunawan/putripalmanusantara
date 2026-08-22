"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { LegalCertificateDocument, LegalDocumentCategory, Locale } from "@ppn/shared-types";
import {
  getMediaPolicy,
  isLegalDocumentExpired,
  legalDocumentCategoryLabel,
} from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DocumentUploadField } from "@/components/admin/DocumentUploadField";
import { ListToolbar, type ActiveFilter, type SortKey } from "@/components/admin/ListToolbar";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SkeletonCard, SkeletonListRows } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_PDF_BYTES = getMediaPolicy("document").maxBytes;
const MAX_PREVIEW_BYTES = getMediaPolicy("general").maxBytes;

type FileKindFilter = "all" | "pdf" | "image";

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function LegalCertificateEditor() {
  const fetchDocuments = useCallback(
    () => adminApi.get<LegalCertificateDocument[]>("/admin/about-company/legal-documents"),
    [],
  );
  const { data: documents, status, reload, retry } = useAdminResource(fetchDocuments);
  const fetchCategories = useCallback(
    () => adminApi.get<LegalDocumentCategory[]>("/admin/about-company/legal-categories"),
    [],
  );
  const { data: categories } = useAdminResource(fetchCategories);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [fileKind, setFileKind] = useState<FileKindFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newFileId, setNewFileId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newTitle.trim()) {
      setError("Judul dokumen wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/legal-documents", {
        title: newTitle,
        file_id: newFileId ?? undefined,
        order: documents?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewTitle("");
      setNewFileId(null);
      await reload();
      showToast("Certificate uploaded.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah dokumen.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/legal-documents/${id}`, patch);
      await reload();
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  async function handleUpdateTranslation(
    doc: LegalCertificateDocument,
    locale: Exclude<Locale, "en">,
    field: "title" | "description",
    value: string,
  ) {
    const current = doc.translations ?? {};
    await handleUpdate(doc.id, {
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/legal-documents/${id}`);
      await reload();
      showToast("Dokumen berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus dokumen. Silakan coba lagi.", "error");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/about-company/legal-documents/${id}/duplicate`);
      await reload();
      showToast("Dokumen diduplikasi sebagai draf nonaktif.");
    } catch {
      showToast("Gagal menduplikasi dokumen. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!documents) return;
    if (to < 0 || to >= documents.length) return;
    const next = arrayMove(documents, from, to);
    try {
      await Promise.all(
        next
          .map((doc, index) =>
            doc.order === index
              ? null
              : adminApi.put(`/admin/about-company/legal-documents/${doc.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load documents." onRetry={() => void retry()} />;

  if (status === "loading" || !documents) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={0} />
        <div className="mt-4">
          <SkeletonListRows rows={2} />
        </div>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = documents
    .map((doc, index) => ({ doc, index }))
    .filter(({ doc }) => {
      if (activeFilter === "active" && !doc.active) return false;
      if (activeFilter === "inactive" && doc.active) return false;
      if (featuredOnly && !doc.featured) return false;
      if (categoryFilter !== "all" && doc.category?.slug !== categoryFilter) return false;
      if (fileKind !== "all" && doc.file?.file_type !== fileKind) return false;
      if (!query) return true;
      return (
        doc.title.toLowerCase().includes(query) ||
        (doc.document_number ?? "").toLowerCase().includes(query) ||
        (doc.issuing_organization ?? "").toLowerCase().includes(query) ||
        (doc.description ?? "").toLowerCase().includes(query) ||
        (doc.file?.alt_text ?? "").toLowerCase().includes(query) ||
        legalDocumentCategoryLabel(doc).toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (sort === "name" ? a.doc.title.localeCompare(b.doc.title) : a.doc.order - b.doc.order));

  const reorderable =
    !query && activeFilter === "all" && !featuredOnly && categoryFilter === "all" && fileKind === "all" && sort === "order";

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Legal & Certificate</h2>
      <p className="mt-1 text-small text-neutral-600">
        Dokumen legal dan sertifikasi — mendukung file PDF maupun gambar (PNG/JPG/WebP).{" "}
        {reorderable ? "Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun." : "Hapus filter/pencarian untuk mengubah urutan."}
      </p>

      {documents.length > 0 && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari judul, nomor, penerbit, atau nama file..."
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          resultCount={visible.length}
          totalCount={documents.length}
        >
          {(["all", "pdf", "image"] as FileKindFilter[]).map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={fileKind === kind}
              onClick={() => setFileKind(kind)}
              className={cn(
                "rounded-button border px-3 py-1 text-small transition-colors",
                fileKind === kind
                  ? "border-primary-600 bg-primary-100 text-primary-700"
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400",
              )}
            >
              {kind === "all" ? "Semua File" : kind === "pdf" ? "PDFs" : "Images"}
            </button>
          ))}
          {/* Featured is a separate axis from Active/Inactive — never conflate the two statuses. */}
          <button
            type="button"
            aria-pressed={featuredOnly}
            onClick={() => setFeaturedOnly((current) => !current)}
            className={cn(
              "rounded-button border px-3 py-1 text-small transition-colors",
              featuredOnly
                ? "border-primary-600 bg-primary-100 text-primary-700"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            ★ Featured
          </button>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter kategori dokumen"
            className="rounded-field border border-neutral-300 bg-white px-3 py-1.5 text-small"
          >
            <option value="all">Semua Kategori</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </ListToolbar>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {documents.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada dokumen legal atau sertifikat.</p>
            <p className="mt-1 text-small text-neutral-500">Gunakan formulir “+ Add Document” di bawah.</p>
          </div>
        )}
        {documents.length > 0 && visible.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada dokumen yang cocok dengan pencarian/filter.</p>
        )}
        {visible.map(({ doc, index }) => {
          const rowProps = reorderable ? getRowProps(index) : { draggable: false, className: "" };
          const expanded = expandedIds.has(doc.id);
          const thumb = doc.preview_image ?? (doc.file?.file_type === "image" ? doc.file : null);
          return (
            <div
              key={doc.id}
              {...rowProps}
              className={cn("rounded-field border border-neutral-200 transition-opacity", rowProps.className)}
            >
              {/* Collapsed summary — always visible; the row never opens as a long form by default. */}
              <div className="flex flex-wrap items-center gap-3 p-4">
                {reorderable && (
                  <span {...getHandleProps(index)}>
                    <DragHandle />
                  </span>
                )}
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-50">
                  {thumb ? (
                    <Image src={thumb.file_url} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-small text-neutral-400">
                      {doc.file?.file_type === "pdf" ? "PDF" : "—"}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpanded(doc.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={expanded}
                >
                  <span className="truncate text-body font-medium text-neutral-900">{doc.title}</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{legalDocumentCategoryLabel(doc)}</Badge>
                  {isLegalDocumentExpired(doc) && (
                    <span className="rounded-button bg-amber-100 px-2.5 py-1 text-small font-medium text-amber-900">
                      Expired
                    </span>
                  )}
                  {doc.verified && (
                    <span className="rounded-button bg-primary-100 px-2.5 py-1 text-small font-medium text-primary-700">
                      ✓ Verified
                    </span>
                  )}
                  <Badge variant={doc.active ? "primary" : "neutral"}>{doc.active ? "Active" : "Inactive"}</Badge>
                  {doc.featured && <Badge variant="primary">★ Featured</Badge>}
                  {doc.file && <Badge variant="neutral">{doc.file.file_type === "pdf" ? "PDF" : "Image"}</Badge>}
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpanded(doc.id)}
                  aria-expanded={expanded}
                  className="shrink-0 rounded-button border border-neutral-300 px-3 py-1.5 text-small font-medium text-neutral-700 transition-colors hover:border-neutral-400"
                >
                  {expanded ? "Collapse" : "Edit"}
                </button>
              </div>

              {/* Quick actions — status toggles + row actions, kept outside the expandable form. */}
              <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-4 py-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={doc.active} onChange={(e) => void handleUpdate(doc.id, { active: e.target.checked })} className="h-4 w-4" />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={doc.featured} onChange={(e) => void handleUpdate(doc.id, { featured: e.target.checked })} className="h-4 w-4" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={doc.verified} onChange={(e) => void handleUpdate(doc.id, { verified: e.target.checked })} className="h-4 w-4" />
                  Verified
                </label>
                <button type="button" onClick={() => void handleDuplicate(doc.id)} className="text-small text-neutral-600 underline">
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
                  disabled={index === documents.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(doc.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              {!expanded ? null : (
              <div className="border-t border-neutral-100 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-small">Judul Dokumen</Label>
                  <Input defaultValue={doc.title} onBlur={(e) => void handleUpdate(doc.id, { title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Kategori</Label>
                  <select
                    defaultValue={doc.category?.id ?? ""}
                    onChange={(e) => void handleUpdate(doc.id, { category_id: e.target.value || null })}
                    className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body"
                  >
                    <option value="">Tanpa kategori</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-small">Negara Penerbit (opsional)</Label>
                  <Input
                    defaultValue={doc.country ?? ""}
                    placeholder="mis. Indonesia"
                    onBlur={(e) => void handleUpdate(doc.id, { country: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-small">Nomor Dokumen (opsional)</Label>
                  <Input defaultValue={doc.document_number ?? ""} onBlur={(e) => void handleUpdate(doc.id, { document_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Penerbit (opsional)</Label>
                  <Input defaultValue={doc.issuing_organization ?? ""} onBlur={(e) => void handleUpdate(doc.id, { issuing_organization: e.target.value })} />
                </div>
                <div>
                  <Label className="text-small">Tanggal Terbit (opsional)</Label>
                  <Input type="date" defaultValue={toDateInputValue(doc.issue_date)} onBlur={(e) => void handleUpdate(doc.id, { issue_date: e.target.value || undefined })} />
                </div>
                <div>
                  <Label className="text-small">Tanggal Kedaluwarsa (opsional)</Label>
                  <Input type="date" defaultValue={toDateInputValue(doc.expiry_date)} onBlur={(e) => void handleUpdate(doc.id, { expiry_date: e.target.value || undefined })} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-small">Deskripsi (opsional)</Label>
                  <Textarea rows={2} defaultValue={doc.description ?? ""} onBlur={(e) => void handleUpdate(doc.id, { description: e.target.value })} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DocumentUploadField
                  label="File Dokumen"
                  media={doc.file}
                  onChange={(media) => void handleUpdate(doc.id, { file_id: media.id })}
                  onRemove={() => void handleUpdate(doc.id, { file_id: null })}
                  maxSizeBytes={MAX_PDF_BYTES}
                  hint="PDF (disarankan), atau PNG/JPG/WebP untuk sertifikat berupa gambar. Maksimum 10MB."
                />
                <MediaUploadField
                  label="Preview Image (opsional)"
                  media={doc.preview_image}
                  onChange={(media) => void handleUpdate(doc.id, { preview_image_id: media.id })}
                  onRemove={() => void handleUpdate(doc.id, { preview_image_id: null })}
                  maxSizeBytes={MAX_PREVIEW_BYTES}
                  hint="Thumbnail untuk dokumen PDF (PDF tidak punya pratinjau gambar sendiri). Maksimum 5MB."
                  previewFit="contain"
                />
              </div>

              <details className="mt-3 border-t border-neutral-100 pt-3">
                <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                  🌐 Translations
                  <TranslationStatusBadges
                    translations={doc.translations}
                    base={{ title: doc.title, description: doc.description }}
                  />
                </summary>
                <div className="mt-3">
                  <LocaleTabs>
                    {(locale) =>
                      locale === "en" ? (
                        <p className="text-small text-neutral-500">
                          Bahasa Inggris diedit langsung pada field Judul &amp; Deskripsi di atas.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="text-small">Judul</Label>
                            <Input
                              defaultValue={doc.translations?.[locale]?.title ?? ""}
                              placeholder={doc.title}
                              onBlur={(e) => void handleUpdateTranslation(doc, locale, "title", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-small">Deskripsi</Label>
                            <Textarea
                              rows={2}
                              defaultValue={doc.translations?.[locale]?.description ?? ""}
                              placeholder={doc.description ?? ""}
                              onBlur={(e) => void handleUpdateTranslation(doc, locale, "description", e.target.value)}
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
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Document</p>
        <DocumentUploadField
          label="File Dokumen (opsional, bisa ditambahkan setelah dibuat)"
          media={null}
          onChange={(media) => setNewFileId(media.id)}
          maxSizeBytes={MAX_PDF_BYTES}
        />
        <div>
          <Label htmlFor="new-doc-title">Judul Dokumen</Label>
          <Input id="new-doc-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Document
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Delete this document?"
          message="This document will no longer appear on the public About Company page."
          confirmLabel="Delete"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
