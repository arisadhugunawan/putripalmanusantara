"use client";

import { Button, Card, cn, Input, Label } from "@ppn/ui-components";
import type { Locale, SupplyNetworkCountry } from "@ppn/shared-types";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

/** Destination markers for the section's subtle background "global trade" motif — never a real
 * GIS map, just a name + flag + short status label (brief §18/§32). */
export function SupplyNetworkCountriesEditor() {
  const fetchCountries = useCallback(
    () => adminApi.get<SupplyNetworkCountry[]>("/admin/supply-network/countries"),
    [],
  );
  const { data: countries, status, reload, retry } = useAdminResource(fetchCountries);

  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newFlag, setNewFlag] = useState("🌍");
  const [newStatus, setNewStatus] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newName.trim()) {
      setError("Nama negara wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/supply-network/countries", {
        name: newName,
        flag_emoji: newFlag || undefined,
        status: newStatus,
        order: countries?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewName("");
      setNewFlag("🌍");
      setNewStatus("");
      await reload();
      showToast("Negara berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah negara.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/supply-network/countries/${id}`, patch);
      await reload();
    } catch {
      showToast("Perubahan tidak dapat disimpan.", "error");
      await reload();
    }
  }

  async function handleUpdateTranslation(
    country: SupplyNetworkCountry,
    locale: Exclude<Locale, "en">,
    field: "name" | "status",
    value: string,
  ) {
    const current = country.translations ?? {};
    await handleUpdate(country.id, {
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/supply-network/countries/${id}`);
      await reload();
      showToast("Negara berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus negara. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!countries) return;
    if (to < 0 || to >= countries.length) return;
    const next = arrayMove(countries, from, to);
    try {
      await Promise.all(
        next
          .map((country, index) =>
            country.order === index
              ? null
              : adminApi.put(`/admin/supply-network/countries/${country.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Gagal memuat daftar negara." onRetry={() => void retry()} />;

  if (status === "loading" || !countries) {
    return (
      <div className="mt-6">
        <SkeletonListRows rows={3} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Global Market — Negara Tujuan</h2>
      <p className="mt-1 text-small text-neutral-600">
        Penanda negara tujuan pada motif latar &ldquo;global trade&rdquo; di belakang diagram —
        bukan peta GIS, hanya nama + bendera + status singkat.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {countries.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada negara.</p>
          </div>
        )}
        {countries.map((country, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={country.id}
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
                  defaultValue={country.flag_emoji}
                  onBlur={(e) => void handleUpdate(country.id, { flag_emoji: e.target.value })}
                  className="w-16 text-center text-h3"
                />
                <div className="min-w-[10rem] flex-1">
                  <Input defaultValue={country.name} onBlur={(e) => void handleUpdate(country.id, { name: e.target.value })} placeholder="Nama negara" />
                </div>
                <div className="min-w-[10rem] flex-1">
                  <Input
                    defaultValue={country.status}
                    onBlur={(e) => void handleUpdate(country.id, { status: e.target.value })}
                    placeholder="mis. Active Market"
                  />
                </div>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={country.active} onChange={(e) => void handleUpdate(country.id, { active: e.target.checked })} className="h-4 w-4" />
                  Aktif
                </label>
                <button type="button" onClick={() => void handleReorder(index, index - 1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleReorder(index, index + 1)}
                  disabled={index === countries.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(country.id)} className="text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              <details className="mt-2">
                <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                  🌐 Translations
                  <TranslationStatusBadges
                    translations={country.translations}
                    base={{ name: country.name, status: country.status }}
                  />
                </summary>
                <div className="mt-2">
                  <LocaleTabs>
                    {(locale) =>
                      locale === "en" ? (
                        <p className="text-small text-neutral-500">
                          Bahasa Inggris diedit langsung pada field Nama &amp; Status di atas.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-small">Nama Negara</Label>
                            <Input
                              defaultValue={country.translations?.[locale]?.name ?? ""}
                              placeholder={country.name}
                              onBlur={(e) => void handleUpdateTranslation(country, locale, "name", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-small">Status</Label>
                            <Input
                              defaultValue={country.translations?.[locale]?.status ?? ""}
                              placeholder={country.status}
                              onBlur={(e) => void handleUpdateTranslation(country, locale, "status", e.target.value)}
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

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div>
          <Label className="text-small">Bendera (emoji)</Label>
          <Input value={newFlag} onChange={(e) => setNewFlag(e.target.value)} className="w-16 text-center text-h3" />
        </div>
        <div>
          <Label className="text-small">Nama Negara</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="mis. Thailand" required />
        </div>
        <div>
          <Label className="text-small">Status (opsional)</Label>
          <Input value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="mis. Active Market" />
        </div>
        <Button type="submit">Add Country</Button>
      </form>
      {error && <p className="mt-2 text-small text-red-600">{error}</p>}

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus negara ini?"
          message="Penanda negara ini akan dihapus dari motif latar. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
