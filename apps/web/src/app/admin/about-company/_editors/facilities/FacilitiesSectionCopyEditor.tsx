"use client";

import type { AboutCompanyFacilitiesSection } from "@ppn/shared-types";
import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import { useCallback } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/**
 * Heading copy for the "Our Facilities" showcase — eyebrow/heading/description plus the
 * auto-rotation toggle (brief: "Admin dapat mengaktifkan/menonaktifkan Auto Play"). The
 * facility list itself is edited in `FacilitiesEditor` below this on the same page.
 */
export function FacilitiesSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyFacilitiesSection>("/admin/about-company/facilities-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/facilities-section", patch);
      await reload();
    } catch (err) {
      showToast(
        err instanceof ApiRequestError ? err.message : "Changes could not be saved.",
        "error",
      );
      await reload();
    }
  }

  if (status === "error") {
    return <AdminLoadError message="Failed to load facilities section content." onRetry={() => void retry()} />;
  }

  if (status === "loading" || !section) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={3} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Judul Section</h2>
      <p className="mt-1 text-small text-neutral-600">
        Teks pembuka dan pengaturan auto-rotasi section &quot;Our Facilities&quot; di halaman publik.
        Tersimpan otomatis sebagai draf.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="facilities-eyebrow">Eyebrow</Label>
            <Input
              id="facilities-eyebrow"
              defaultValue={section.eyebrow}
              placeholder="mis. Built for Scale"
              onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="facilities-heading">Judul</Label>
            <Input
              id="facilities-heading"
              defaultValue={section.heading}
              placeholder="mis. Our Facilities"
              onBlur={(e) => void handleUpdate({ heading: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="facilities-description">Deskripsi Pendukung</Label>
          <Textarea
            id="facilities-description"
            rows={3}
            defaultValue={section.description}
            onBlur={(e) => void handleUpdate({ description: e.target.value })}
          />
        </div>

        <label className="flex items-start gap-2 rounded-field border border-neutral-200 p-3 text-small text-neutral-700">
          <input
            type="checkbox"
            checked={section.auto_rotate}
            onChange={(e) => void handleUpdate({ auto_rotate: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Auto-rotasi fasilitas
            <span className="mt-0.5 block text-small text-neutral-500">
              Berpindah otomatis ke fasilitas berikutnya jika pengunjung tidak berinteraksi.
              Berhenti otomatis saat pengunjung hover/klik/sentuh, lalu lanjut lagi setelah beberapa detik.
            </span>
          </span>
        </label>

        <div className="max-w-xs">
          <Label htmlFor="facilities-interval">Interval Auto-Rotasi (detik)</Label>
          <Input
            id="facilities-interval"
            type="number"
            min={5}
            max={7}
            defaultValue={section.rotate_interval_seconds}
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (!Number.isFinite(value)) return;
              void handleUpdate({
                rotate_interval_seconds: Math.min(7, Math.max(5, Math.round(value))),
              });
            }}
          />
          <p className="mt-1 text-small text-neutral-500">Antara 5–7 detik.</p>
        </div>
      </div>
    </Card>
  );
}
