"use client";

import type { ExportDestination } from "@ppn/shared-types";
import { Badge, Card } from "@ppn/ui-components";
import Link from "next/link";
import { useCallback } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";
import { flagEmoji } from "@/components/about/company-profile/flagEmoji";

/**
 * "Countries We Have Exported To" curation — reuses the exact same `ExportDestination` records
 * as the Homepage's own Global Export Reach map (see README). Adding/editing/deleting a
 * country, its flag, region and description, and its shared display order all stay in that one
 * existing editor so the two surfaces never disagree about what a country's own data is; this
 * panel only toggles the independent `show_in_company_profile` flag that decides whether a
 * country also appears in this section. A country never shows here unless the Admin flips it on
 * — nothing is auto-activated by adding it to the shared list.
 */
export function CompanyProfileCountriesEditor() {
  const fetchCountries = useCallback(
    () => adminApi.get<ExportDestination[]>("/admin/about-company/company-profile-countries"),
    [],
  );
  const { data: countries, status, reload, retry } = useAdminResource(fetchCountries);
  const { showToast } = useToast();

  async function handleToggle(id: string, show: boolean) {
    try {
      await adminApi.put(`/admin/about-company/company-profile-countries/${id}`, {
        show_in_company_profile: show,
      });
      await reload();
    } catch {
      showToast("Changes could not be saved. Please try again.", "error");
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Countries We Have Exported To</h2>
      <p className="mt-1 text-small text-neutral-600">
        Grid bendera negara di halaman publik hanya menampilkan negara yang diaktifkan di bawah ini. Menambah,
        mengedit, menghapus, atau mengubah urutan negara dilakukan di satu tempat yang sama dipakai peta{" "}
        <strong>Global Export Reach</strong> di beranda.{" "}
        <Link href="/admin/homepage/export_reach" className="font-medium text-primary-700 underline">
          Kelola Negara Tujuan Ekspor
        </Link>
      </p>

      {status === "error" && (
        <AdminLoadError message="Failed to load countries." onRetry={() => void retry()} />
      )}

      {status === "loading" && (
        <div className="mt-4">
          <SkeletonListRows rows={3} />
        </div>
      )}

      {status === "ready" && countries && (
        <div className="mt-5 flex flex-col gap-2">
          {countries.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-body text-neutral-600">Belum ada negara tujuan ekspor.</p>
              <p className="mt-1 text-small text-neutral-500">
                Tambahkan negara di editor Global Export Reach terlebih dahulu.
              </p>
            </div>
          )}
          {countries.map((country) => (
            <div
              key={country.id}
              className="flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3"
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {flagEmoji(country.country_code)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-neutral-900">{country.country_name}</p>
                {country.region && <p className="text-small text-neutral-500">{country.region}</p>}
              </div>
              <Badge variant={country.enabled ? "primary" : "neutral"}>
                {country.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <label className="flex items-center gap-2 text-small text-neutral-700">
                <input
                  type="checkbox"
                  checked={country.show_in_company_profile}
                  onChange={(e) => void handleToggle(country.id, e.target.checked)}
                  className="h-4 w-4"
                />
                Tampilkan di CV. Putri Palma Nusantara
              </label>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
