"use client";

import type { AboutCompanyFact, AboutCompanyProfile, Locale } from "@ppn/shared-types";
import { ABOUT_COMPANY_FACT_ICONS } from "@ppn/shared-types";
import { Badge, Button, Card, cn, Input, Label } from "@ppn/ui-components";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

/**
 * 05 — Company Facts CRUD. Generic label/value rows so the public grid only ever shows facts
 * the Admin actually entered; nothing is pre-seeded, because a fabricated capacity or employee
 * count is exactly the kind of claim this project forbids.
 */
export function CompanyFactsEditor({
  profile,
  onUpdate,
}: {
  profile: AboutCompanyProfile;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const fetchFacts = useCallback(
    () => adminApi.get<AboutCompanyFact[]>("/admin/about-company/facts"),
    [],
  );
  const { data: facts, status, reload, retry } = useAdminResource(fetchFacts);

  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newLabel.trim() || !newValue.trim()) {
      setError("Label dan Value wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/facts", {
        label: newLabel,
        value: newValue,
        icon: newIcon || undefined,
        order: facts?.length ?? 0,
        active: true,
      });
      setNewLabel("");
      setNewValue("");
      setNewIcon("");
      await reload();
      showToast("Company fact ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah fact.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/facts/${id}`, patch);
      await reload();
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  async function handleUpdateTranslation(
    fact: AboutCompanyFact,
    locale: Exclude<Locale, "en">,
    field: "label" | "value",
    value: string,
  ) {
    const current = fact.translations ?? {};
    await handleUpdate(fact.id, {
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/facts/${id}`);
      await reload();
      showToast("Company fact dihapus.");
    } catch {
      showToast("Gagal menghapus fact. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!facts) return;
    if (to < 0 || to >= facts.length) return;
    const next = arrayMove(facts, from, to);
    try {
      await Promise.all(
        next
          .map((fact, index) =>
            fact.order === index
              ? null
              : adminApi.put(`/admin/about-company/facts/${fact.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan fact.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h3 text-neutral-900">05 · Company Facts</h2>
          <p className="mt-1 text-small text-neutral-600">
            Pasangan label/nilai yang tampil sebagai grid ringkas. Seret kartu untuk mengubah urutan, atau gunakan
            Naik/Turun.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-small text-neutral-700">
          <input
            type="checkbox"
            checked={profile.facts_visible}
            onChange={(event) => onUpdate({ facts_visible: event.target.checked })}
            className="h-4 w-4"
          />
          Tampilkan blok ini
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ac-facts-label">Label Blok</Label>
          <Input
            id="ac-facts-label"
            defaultValue={profile.facts_label}
            onBlur={(e) => onUpdate({ facts_label: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="ac-facts-heading">Judul (opsional)</Label>
          <Input
            id="ac-facts-heading"
            defaultValue={profile.facts_heading}
            onBlur={(e) => onUpdate({ facts_heading: e.target.value })}
          />
        </div>
      </div>

      {status === "error" && (
        <AdminLoadError message="Failed to load company facts." onRetry={() => void retry()} />
      )}

      {status === "loading" && (
        <div className="mt-4">
          <SkeletonListRows rows={2} />
        </div>
      )}

      {status === "ready" && facts && (
        <div className="mt-5 flex flex-col gap-3">
          {facts.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-body text-neutral-600">No company facts have been added.</p>
              <p className="mt-1 text-small text-neutral-500">Gunakan formulir “+ Add Fact” di bawah.</p>
            </div>
          )}
          {facts.map((fact, index) => {
            const rowProps = getRowProps(index);
            return (
              <div
                key={fact.id}
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
                  <Badge variant={fact.active ? "primary" : "neutral"}>
                    {fact.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-small text-neutral-500">
                    Order {String(index + 1).padStart(2, "0")}
                  </span>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={fact.active}
                      onChange={(e) => void handleUpdate(fact.id, { active: e.target.checked })}
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
                    disabled={index === facts.length - 1}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(fact.id)}
                    className="ml-auto text-small text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_10rem]">
                  <div>
                    <Label className="text-small">Label</Label>
                    <Input
                      defaultValue={fact.label}
                      onBlur={(e) => void handleUpdate(fact.id, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Value</Label>
                    <Input
                      defaultValue={fact.value}
                      onBlur={(e) => void handleUpdate(fact.id, { value: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Ikon</Label>
                    <select
                      defaultValue={fact.icon ?? ""}
                      onChange={(e) => void handleUpdate(fact.id, { icon: e.target.value })}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2.5 text-body"
                    >
                      <option value="">Tanpa ikon</option>
                      {ABOUT_COMPANY_FACT_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <details className="mt-3 border-t border-neutral-100 pt-3">
                  <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                    🌐 Translations
                    <TranslationStatusBadges
                      translations={fact.translations}
                      base={{ label: fact.label, value: fact.value }}
                    />
                  </summary>
                  <div className="mt-3">
                    <GenerateTranslationsPanel
                      statusUrl={`/admin/about-company/facts/${fact.id}/translation-status`}
                      generateUrl={`/admin/about-company/facts/${fact.id}/translations/generate`}
                      onGenerated={() => void reload()}
                    />
                    <LocaleTabs>
                      {(locale) =>
                        locale === "en" ? (
                          <p className="text-small text-neutral-500">
                            Bahasa Inggris diedit langsung pada field Label &amp; Value di atas.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <Label className="text-small">Label</Label>
                              <Input
                                defaultValue={fact.translations?.[locale]?.label ?? ""}
                                placeholder={fact.label}
                                onBlur={(e) => void handleUpdateTranslation(fact, locale, "label", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-small">Value</Label>
                              <Input
                                defaultValue={fact.translations?.[locale]?.value ?? ""}
                                placeholder={fact.value}
                                onBlur={(e) => void handleUpdateTranslation(fact, locale, "value", e.target.value)}
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
            );
          })}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Fact</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_10rem]">
          <div>
            <Label htmlFor="new-fact-label">Label</Label>
            <Input
              id="new-fact-label"
              value={newLabel}
              placeholder="mis. Location"
              onChange={(e) => setNewLabel(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-fact-value">Value</Label>
            <Input
              id="new-fact-value"
              value={newValue}
              placeholder="mis. Palu, Central Sulawesi, Indonesia"
              onChange={(e) => setNewValue(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-fact-icon">Ikon</Label>
            <select
              id="new-fact-icon"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-full rounded-field border border-neutral-300 px-3 py-2.5 text-body"
            >
              <option value="">Tanpa ikon</option>
              {ABOUT_COMPANY_FACT_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Fact
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus company fact ini?"
          message="Fact ini tidak akan tampil lagi di halaman About Company setelah dipublikasikan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
