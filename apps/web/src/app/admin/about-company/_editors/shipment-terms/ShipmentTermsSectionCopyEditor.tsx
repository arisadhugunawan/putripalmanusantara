"use client";

import type { AboutCompanyShipmentTermsSection, Locale } from "@ppn/shared-types";
import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import { useCallback } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Field key → label, used both for the English inputs below and as the field list rendered
 * inside each non-English `LocaleTabs` tab. */
const FIELDS: { key: keyof AboutCompanyShipmentTermsSection; label: string; multiline?: boolean }[] = [
  { key: "eyebrow", label: "Eyebrow" },
  { key: "heading", label: "Judul" },
  { key: "introduction", label: "Introduction", multiline: true },
  { key: "commitment_title", label: "Our Commitment — Judul (premium statement)", multiline: true },
  { key: "commitment_description", label: "Our Commitment — Deskripsi", multiline: true },
  { key: "cta_label", label: "CTA — Label" },
];

export function ShipmentTermsSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyShipmentTermsSection>("/admin/about-company/shipment-terms-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/shipment-terms-section", patch);
      await reload();
    } catch (err) {
      showToast(
        err instanceof ApiRequestError ? err.message : "Changes could not be saved.",
        "error",
      );
      await reload();
    }
  }

  async function handleSaveTranslation(locale: Locale, key: string, value: string) {
    if (!section) return;
    const current = section.translations ?? {};
    await handleUpdate({
      translations: { ...current, [locale]: { ...current[locale], [key]: value } },
    });
  }

  if (status === "error") {
    return <AdminLoadError message="Failed to load Shipment Terms content." onRetry={() => void retry()} />;
  }

  if (status === "loading" || !section) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={5} />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Judul Section &amp; Copy</h2>
      <p className="mt-1 text-small text-neutral-600">
        Teks pembuka, pernyataan &quot;Our Commitment&quot;, dan CTA di bagian bawah section
        &quot;Shipment Terms&quot;. Tersimpan otomatis sebagai draf.
      </p>

      <div className="mt-4">
        <LocaleTabs>
          {(locale) =>
            locale === "en" ? (
              <div className="flex flex-col gap-4">
                {FIELDS.map((field) =>
                  field.multiline ? (
                    <div key={field.key}>
                      <Label htmlFor={`shipment-${field.key}`}>{field.label}</Label>
                      <Textarea
                        id={`shipment-${field.key}`}
                        rows={3}
                        defaultValue={section[field.key] as string}
                        onBlur={(e) => void handleUpdate({ [field.key]: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div key={field.key}>
                      <Label htmlFor={`shipment-${field.key}`}>{field.label}</Label>
                      <Input
                        id={`shipment-${field.key}`}
                        defaultValue={section[field.key] as string}
                        onBlur={(e) => void handleUpdate({ [field.key]: e.target.value })}
                      />
                    </div>
                  ),
                )}
                <div>
                  <Label htmlFor="shipment-cta-href">CTA — URL</Label>
                  <Input
                    id="shipment-cta-href"
                    defaultValue={section.cta_href}
                    placeholder="/contact#request-quotation"
                    onBlur={(e) => void handleUpdate({ cta_href: e.target.value })}
                  />
                  <p className="mt-1 text-small text-neutral-500">
                    Tidak diterjemahkan — URL/anchor bukan konten berbahasa.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-small text-neutral-700">
                  <input
                    type="checkbox"
                    defaultChecked={section.cta_open_new_tab}
                    onChange={(e) => void handleUpdate({ cta_open_new_tab: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Buka CTA di tab baru
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {FIELDS.map((field) =>
                  field.multiline ? (
                    <div key={field.key}>
                      <Label className="text-small">{field.label}</Label>
                      <Textarea
                        rows={3}
                        defaultValue={section.translations?.[locale]?.[field.key] ?? ""}
                        placeholder={section[field.key] as string}
                        onBlur={(e) => void handleSaveTranslation(locale, field.key, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div key={field.key}>
                      <Label className="text-small">{field.label}</Label>
                      <Input
                        defaultValue={section.translations?.[locale]?.[field.key] ?? ""}
                        placeholder={section[field.key] as string}
                        onBlur={(e) => void handleSaveTranslation(locale, field.key, e.target.value)}
                      />
                    </div>
                  ),
                )}
                <p className="text-small text-neutral-500">
                  Kosongkan untuk memakai teks Inggris sebagai fallback.
                </p>
              </div>
            )
          }
        </LocaleTabs>
      </div>
    </Card>
  );
}
