"use client";

import { Badge, Button, Card, Input, Label } from "@ppn/ui-components";
import type { ContactLocation, ContactLocationType, Locale } from "@ppn/shared-types";
import { FormEvent, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

const LOCATION_TYPE_LABEL: Record<ContactLocationType, string> = {
  head_office: "Head Office",
  operational: "Operational",
  business: "Business",
};

/**
 * Admin — Locations (brief item 20). Same onBlur-auto-save-to-draft, add/delete/reorder
 * pattern as `PartnerLogoEditor.tsx` — auto-saving here only touches the draft
 * `ContactLocation` table, never the live site (which reads the separate published snapshot),
 * so this satisfies "no automatic live updates" the same way every other Admin list editor in
 * this project already does.
 */
export function LocationsEditor({
  locations,
  onChange,
}: {
  locations: ContactLocation[];
  onChange: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Set when the Admin picks "Head Office" for a location while a different location already
  // holds it — confirmed before the PUT is sent, since it silently demotes that other location.
  const [headOfficeChange, setHeadOfficeChange] = useState<{ id: string; fromName: string } | null>(null);
  const { showToast } = useToast();

  const currentHeadOffice = locations.find((l) => l.location_type === "head_office");

  function handleLocationTypeChange(id: string, value: string) {
    if (value === "head_office" && currentHeadOffice && currentHeadOffice.id !== id) {
      setHeadOfficeChange({ id, fromName: currentHeadOffice.name || "the current location" });
      return;
    }
    void handleUpdate(id, { location_type: value });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    if (!name || !address) {
      setError("Nama dan alamat wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/contact-page/locations", {
        name,
        address,
        label: formData.get("label") || undefined,
        location_type: formData.get("location_type") || "operational",
        google_maps_url: formData.get("google_maps_url") || undefined,
        order: locations.length,
        active: true,
      });
      form.reset();
      await onChange();
      showToast("Lokasi berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah lokasi.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/contact-page/locations/${id}`, patch);
      await onChange();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Gagal menyimpan perubahan.", "error");
    }
  }

  async function handleUpdateTranslation(
    location: ContactLocation,
    locale: Exclude<Locale, "en">,
    value: string,
  ) {
    const current = location.translations ?? {};
    await handleUpdate(location.id, {
      translations: { ...current, [locale]: { ...current[locale], label: value } },
    });
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/contact-page/locations/${id}`);
      await onChange();
      showToast("Lokasi berhasil dihapus.");
      setDeleteTargetId(null);
    } catch {
      showToast("Gagal menghapus lokasi. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= locations.length) return;
    const a = locations[index];
    const b = locations[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/contact-page/locations/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/contact-page/locations/${b.id}`, { order: a.order }),
      ]);
      await onChange();
    } catch {
      showToast("Gagal memperbarui urutan lokasi.", "error");
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Locations</h2>
      <p className="mt-1 text-small text-neutral-600">
        Tolitoli / Palu / Surabaya secara default, tapi Anda bisa menambah atau menghapus
        lokasi kapan saja. &ldquo;Active&rdquo; mengontrol apakah lokasi ini muncul di halaman
        Contact publik setelah dipublikasikan — menonaktifkan tidak menghapus datanya.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {locations.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">Belum ada lokasi.</p>
          </div>
        )}
        {locations.map((location, index) => (
          <div key={location.id} className="rounded-field border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-body font-medium text-neutral-900">{location.name || "(Tanpa nama)"}</p>
              <Badge variant={location.active ? "primary" : "neutral"}>{location.active ? "Active" : "Inactive"}</Badge>
              <span className="text-small text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
              <label className="flex items-center gap-2 text-small text-neutral-600">
                <input
                  type="checkbox"
                  checked={location.active}
                  onChange={() => void handleUpdate(location.id, { active: !location.active })}
                  className="h-4 w-4"
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => void handleMove(index, -1)}
                disabled={index === 0}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Naik
              </button>
              <button
                type="button"
                onClick={() => void handleMove(index, 1)}
                disabled={index === locations.length - 1}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Turun
              </button>
              <button type="button" onClick={() => setDeleteTargetId(location.id)} className="ml-auto text-small text-red-600 underline">
                Hapus
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-small">Location Name</Label>
                <Input defaultValue={location.name} onBlur={(e) => void handleUpdate(location.id, { name: e.target.value })} />
              </div>
              <div>
                <Label className="text-small">Location Type</Label>
                <select
                  value={location.location_type}
                  onChange={(e) => handleLocationTypeChange(location.id, e.target.value)}
                  className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                >
                  {Object.entries(LOCATION_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-small">Label (mis. &ldquo;Head Office&rdquo;, &ldquo;Operational Location&rdquo;)</Label>
                <Input defaultValue={location.label} onBlur={(e) => void handleUpdate(location.id, { label: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-small">Address</Label>
                <textarea
                  defaultValue={location.address}
                  onBlur={(e) => void handleUpdate(location.id, { address: e.target.value })}
                  rows={3}
                  className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                />
              </div>
              <div>
                <Label className="text-small">Google Maps URL</Label>
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  defaultValue={location.google_maps_url}
                  onBlur={(e) => void handleUpdate(location.id, { google_maps_url: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Phone (optional)</Label>
                <Input
                  defaultValue={location.phone ?? ""}
                  onBlur={(e) => void handleUpdate(location.id, { phone: e.target.value || null })}
                />
              </div>
              <div>
                <Label className="text-small">Email (optional)</Label>
                <Input
                  defaultValue={location.email ?? ""}
                  onBlur={(e) => void handleUpdate(location.id, { email: e.target.value || null })}
                />
              </div>
            </div>

            <details className="mt-3 border-t border-neutral-100 pt-3">
              <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                🌐 Translations
                <TranslationStatusBadges
                  translations={location.translations}
                  base={{ label: location.label }}
                />
              </summary>
              <div className="mt-3">
                <LocaleTabs>
                  {(locale) =>
                    locale === "en" ? (
                      <p className="text-small text-neutral-500">
                        Bahasa Inggris diedit langsung pada field Label di atas.
                      </p>
                    ) : (
                      <div>
                        <Label className="text-small">Label</Label>
                        <Input
                          defaultValue={location.translations?.[locale]?.label ?? ""}
                          placeholder={location.label}
                          onBlur={(e) => void handleUpdateTranslation(location, locale, e.target.value)}
                        />
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
        <p className="text-small font-medium text-neutral-900">+ Add Location</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-loc-name">Location Name</Label>
            <Input id="new-loc-name" name="name" required />
          </div>
          <div>
            <Label htmlFor="new-loc-type">Location Type</Label>
            <select id="new-loc-type" name="location_type" defaultValue="operational" className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body">
              {Object.entries(LOCATION_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="new-loc-label">Label</Label>
            <Input id="new-loc-label" name="label" placeholder="mis. Head Office" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="new-loc-address">Address</Label>
            <textarea id="new-loc-address" name="address" required rows={3} className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="new-loc-maps">Google Maps URL</Label>
            <Input id="new-loc-maps" name="google_maps_url" placeholder="https://maps.app.goo.gl/..." />
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Location
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Delete this location?"
          message="This action cannot be undone."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTargetId);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {headOfficeChange && (
        <ConfirmDialog
          title="Change Head Office?"
          message={`This will change Head Office from "${headOfficeChange.fromName}" to this location. Only one location can be Head Office at a time.`}
          confirmLabel="Change Head Office"
          onConfirm={() => {
            void handleUpdate(headOfficeChange.id, { location_type: "head_office" });
            setHeadOfficeChange(null);
          }}
          onCancel={() => setHeadOfficeChange(null)}
        />
      )}
    </Card>
  );
}
