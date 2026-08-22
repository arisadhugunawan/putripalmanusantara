"use client";

import { Button, Card, FormField, Input, Label, Select, Textarea } from "@ppn/ui-components";
import type { HomepageHighlight, HomepageHighlightIcon, Locale } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
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

  async function handleUpdateTranslation(
    highlight: HomepageHighlight,
    locale: Exclude<Locale, "en">,
    field: "title" | "description",
    value: string,
  ) {
    const current = highlight.translations ?? {};
    await handleUpdate(highlight.id, {
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
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
          <div key={highlight.id} className="rounded-field border border-neutral-200 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                aria-label="Ikon"
                className="w-auto text-small"
                defaultValue={highlight.icon}
                onChange={(e) => void handleUpdate(highlight.id, { icon: e.target.value })}
                options={HIGHLIGHT_ICONS}
              />
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

            <details className="mt-2">
              <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                🌐 Translations
                <TranslationStatusBadges
                  translations={highlight.translations}
                  base={{ title: highlight.title, description: highlight.description }}
                />
              </summary>
              <div className="mt-2">
                <LocaleTabs>
                  {(locale) =>
                    locale === "en" ? (
                      <p className="text-small text-neutral-500">
                        Bahasa Inggris diedit langsung pada field Judul &amp; Deskripsi di atas.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-small">Judul</Label>
                          <Input
                            defaultValue={highlight.translations?.[locale]?.title ?? ""}
                            placeholder={highlight.title}
                            onBlur={(e) => void handleUpdateTranslation(highlight, locale, "title", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-small">Deskripsi</Label>
                          <Textarea
                            rows={2}
                            defaultValue={highlight.translations?.[locale]?.description ?? ""}
                            placeholder={highlight.description}
                            onBlur={(e) =>
                              void handleUpdateTranslation(highlight, locale, "description", e.target.value)
                            }
                          />
                        </div>
                        <p className="col-span-full text-small text-neutral-500">
                          Kosongkan untuk memakai teks Inggris sebagai fallback.
                        </p>
                      </div>
                    )
                  }
                </LocaleTabs>
              </div>
            </details>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Tambah Highlight</p>
        <FormField label="Ikon" htmlFor="new-highlight-icon">
          <Select id="new-highlight-icon" name="icon" options={HIGHLIGHT_ICONS} />
        </FormField>
        <FormField label="Judul" htmlFor="new-highlight-title" required>
          <Input id="new-highlight-title" name="title" required />
        </FormField>
        <FormField label="Deskripsi Singkat" htmlFor="new-highlight-desc" required>
          <Input id="new-highlight-desc" name="description" required />
        </FormField>
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
