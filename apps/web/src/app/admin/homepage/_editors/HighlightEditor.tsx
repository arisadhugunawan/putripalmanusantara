"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { HomepageHighlight, HomepageHighlightIcon } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";

const HIGHLIGHT_ICONS: { value: HomepageHighlightIcon; label: string }[] = [
  { value: "quality", label: "Quality (centang)" },
  { value: "sustainability", label: "Sustainability (daun)" },
  { value: "partnership", label: "Partnership (dua orang)" },
  { value: "service", label: "Service (dokumen)" },
  { value: "globe", label: "Globe" },
  { value: "award", label: "Award (medali)" },
];


export function HighlightEditor() {
  const [highlights, setHighlights] = useState<HomepageHighlight[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<HomepageHighlight[]>("/admin/homepage/highlights");
    setHighlights(data);
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
    const formData = new FormData(form);
    setError(null);
    try {
      await adminApi.post("/admin/homepage/highlights", {
        icon: formData.get("icon"),
        title: formData.get("title"),
        description: formData.get("description"),
        order: highlights?.length ?? 0,
        enabled: true,
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah highlight.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/highlights/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/homepage/highlights/${id}`);
      await load();
      showToast("Highlight card berhasil dihapus.");
      setDeleteTargetId(null);
    } catch {
      showToast("Gagal menghapus highlight card. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Highlight Cards (About Preview)</h2>
      <p className="mt-1 text-small text-neutral-600">4 kartu keunggulan di bawah teks perkenalan pada section About Company Preview.</p>

      <div className="mt-4 flex flex-col gap-3">
        {highlights?.map((highlight) => (
          <div key={highlight.id} className="flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3">
            <select
              defaultValue={highlight.icon}
              onChange={(e) => void handleUpdate(highlight.id, { icon: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {HIGHLIGHT_ICONS.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
            <Input
              className="max-w-[200px]"
              defaultValue={highlight.title}
              onBlur={(e) => void handleUpdate(highlight.id, { title: e.target.value })}
            />
            <Input
              className="max-w-[280px]"
              defaultValue={highlight.description}
              onBlur={(e) => void handleUpdate(highlight.id, { description: e.target.value })}
            />
            <label className="flex items-center gap-2 text-small text-neutral-600">
              <input
                type="checkbox"
                checked={highlight.enabled}
                onChange={(e) => void handleUpdate(highlight.id, { enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Aktif
            </label>
            <button type="button" onClick={() => setDeleteTargetId(highlight.id)} className="ml-auto text-small text-red-600 underline">
              Hapus
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Tambah Highlight</p>
        <div>
          <Label htmlFor="new-highlight-icon">Ikon</Label>
          <select id="new-highlight-icon" name="icon" className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body">
            {HIGHLIGHT_ICONS.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {icon.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-highlight-title">Judul</Label>
          <Input id="new-highlight-title" name="title" required />
        </div>
        <div>
          <Label htmlFor="new-highlight-desc">Deskripsi Singkat</Label>
          <Input id="new-highlight-desc" name="description" required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Highlight
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus Highlight Card?"
          message="Kartu keunggulan ini akan dihapus dari section About Company Preview. Tindakan ini tidak dapat dibatalkan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTargetId);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
