"use client";

import { Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type { Locale, ShipmentDocument } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RowTranslationsDisclosure } from "@/components/admin/RowTranslationsDisclosure";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Open-ended, empty-by-default list — the public "Documentation" card shows no expandable
 * list at all until a real document is added here (no fabricated defaults). */
export function ShipmentDocumentsEditor() {
  const fetchDocuments = useCallback(
    () => adminApi.get<ShipmentDocument[]>("/admin/about-company/shipment-documents"),
    [],
  );
  const { data: documents, status, reload, retry } = useAdminResource(fetchDocuments);

  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newName.trim()) {
      setError("Document Name wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/shipment-documents", {
        name: newName,
        order: documents?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewName("");
      await reload();
      showToast("Document ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah document.");
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
      await adminApi.put(`/admin/about-company/shipment-documents/${id}`, patch);
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
      await adminApi.delete(`/admin/about-company/shipment-documents/${id}`);
      await reload();
      showToast("Document dihapus.");
    } catch {
      showToast("Gagal menghapus document. Silakan coba lagi.", "error");
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
              : adminApi.put(`/admin/about-company/shipment-documents/${doc.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load shipment documents." onRetry={() => void retry()} />;

  if (status === "loading" || !documents) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={3} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Documentation</h2>
      <p className="mt-1 text-small text-neutral-600">
        Daftar dokumen opsional (mis. Packing List, Commercial Invoice, Bill of Lading). Daftar
        ini <strong>tidak akan tampil sama sekali</strong> di halaman publik selama masih kosong
        — tambahkan dokumen di sini agar expandable list muncul. Kosongkan URL jika file belum
        tersedia; jangan gunakan tautan palsu.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {documents.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada document.</p>
          </div>
        )}
        {documents.map((document, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={document.id}
              {...rowProps}
              className={cn("flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity", rowProps.className)}
            >
              <span {...getHandleProps(index)} className="mt-7">
                <DragHandle />
              </span>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-small">Document Name *</Label>
                    <Input defaultValue={document.name} onBlur={(e) => void handleUpdate(document.id, { name: e.target.value }, "Document Name")} />
                  </div>
                  <div>
                    <Label className="text-small">URL (opsional)</Label>
                    <Input
                      defaultValue={document.url ?? ""}
                      placeholder="https://..."
                      onBlur={(e) => void handleUpdate(document.id, { url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-small">Description (opsional)</Label>
                  <Textarea rows={2} defaultValue={document.description} onBlur={(e) => void handleUpdate(document.id, { description: e.target.value })} />
                </div>
                <RowTranslationsDisclosure
                  key={`${document.id}-${JSON.stringify(document.translations ?? {})}`}
                  translations={document.translations}
                  fields={[
                    { key: "name", label: "Document Name" },
                    { key: "description", label: "Description" },
                  ]}
                  onSave={(locale: Locale, key, value) =>
                    void handleUpdate(document.id, {
                      translations: {
                        ...(document.translations ?? {}),
                        [locale]: { ...(document.translations?.[locale] ?? {}), [key]: value },
                      },
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" checked={document.active} onChange={(e) => void handleUpdate(document.id, { active: e.target.checked })} className="h-4 w-4" />
                    Aktif
                  </label>
                  <span className="text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === documents.length - 1}
                    className="text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button type="button" onClick={() => setDeleteTargetId(document.id)} className="ml-auto text-red-600 underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Document</p>
        <Input placeholder="Document Name, mis. Packing List" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Document
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus document ini?"
          message="Dokumen akan dihapus dan tidak akan tampil di halaman publik. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
