"use client";

import type { AboutCompanyTeamSection, Locale } from "@ppn/shared-types";
import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import { useCallback } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

/**
 * Heading copy for the PPN Team section — eyebrow, headline, supporting text and an optional
 * CTA. Lives in its own singleton so the section keeps a title even before any member exists,
 * and so nothing here is hard-coded in the public component.
 */
export function TeamSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyTeamSection>("/admin/about-company/team-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/team-section", patch);
      await reload();
    } catch (err) {
      showToast(
        err instanceof ApiRequestError ? err.message : "Changes could not be saved.",
        "error",
      );
      await reload();
    }
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

  if (status === "error") {
    return <AdminLoadError message="Failed to load team section content." onRetry={() => void retry()} />;
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
        Teks pembuka section PPN Team di halaman publik. Tersimpan otomatis sebagai draf.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="team-eyebrow">Eyebrow</Label>
            <Input
              id="team-eyebrow"
              defaultValue={section.eyebrow}
              placeholder="mis. Meet the Team"
              onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="team-heading">Judul</Label>
            <Input
              id="team-heading"
              defaultValue={section.heading}
              placeholder="mis. The People Behind PPN"
              onBlur={(e) => void handleUpdate({ heading: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="team-description">Deskripsi Pendukung</Label>
          <Textarea
            id="team-description"
            rows={3}
            defaultValue={section.description}
            onBlur={(e) => void handleUpdate({ description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="team-cta-label">Label CTA (opsional)</Label>
            <Input
              id="team-cta-label"
              defaultValue={section.cta_label ?? ""}
              onBlur={(e) => void handleUpdate({ cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="team-cta-href">Tautan CTA (opsional)</Label>
            <Input
              id="team-cta-href"
              defaultValue={section.cta_href ?? ""}
              placeholder="mis. /contact"
              onBlur={(e) => void handleUpdate({ cta_href: e.target.value })}
            />
            <p className="mt-1 text-small text-neutral-500">
              Tombol hanya tampil jika label dan tautan sama-sama diisi.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-field border border-neutral-200 p-3 text-small text-neutral-700">
          <input
            type="checkbox"
            checked={section.show_counter}
            onChange={(e) => void handleUpdate({ show_counter: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Tampilkan jumlah anggota tim
            <span className="mt-0.5 block text-small text-neutral-500">
              Dihitung otomatis dari anggota yang aktif dan sudah dipublikasikan — bukan angka yang diketik
              manual, jadi tidak bisa meleset dari isi sebenarnya.
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
  );
}
