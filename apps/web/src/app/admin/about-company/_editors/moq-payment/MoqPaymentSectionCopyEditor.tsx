"use client";

import type { AboutCompanyMoqPaymentSection, Locale } from "@ppn/shared-types";
import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import { useCallback } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/** Field key → label, used both for the English inputs below and as the field list rendered
 * inside each non-English `LocaleTabs` tab. */
const FIELDS: { key: keyof AboutCompanyMoqPaymentSection; label: string; multiline?: boolean }[] = [
  { key: "eyebrow", label: "Eyebrow" },
  { key: "heading", label: "Judul" },
  { key: "introduction", label: "Introduction", multiline: true },
  { key: "supply_capacity_title", label: "Supply Capacity — Judul" },
  { key: "supply_capacity_description", label: "Supply Capacity — Deskripsi", multiline: true },
  { key: "commitment_title", label: "Commitment — Judul (quote-style statement)", multiline: true },
  { key: "commitment_description", label: "Commitment — Deskripsi", multiline: true },
  { key: "cta_title", label: "CTA — Judul" },
  { key: "cta_description", label: "CTA — Deskripsi", multiline: true },
  { key: "cta_button_label", label: "CTA — Label Tombol" },
];

export function MoqPaymentSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyMoqPaymentSection>("/admin/about-company/moq-payment-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/moq-payment-section", patch);
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
    return <AdminLoadError message="Failed to load MOQ & Payment Terms content." onRetry={() => void retry()} />;
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
        Teks pembuka, panel Supply Capacity, pernyataan Commitment, dan CTA di bagian bawah
        section &quot;MOQ &amp; Payment Terms&quot;. Tersimpan otomatis sebagai draf.
      </p>

      <div className="mt-4">
        <GenerateTranslationsPanel
          statusUrl="/admin/about-company/moq-payment-section/translation-status"
          generateUrl="/admin/about-company/moq-payment-section/translations/generate"
          onGenerated={() => void reload()}
        />
        <LocaleTabs>
          {(locale) =>
            locale === "en" ? (
              <div className="flex flex-col gap-4">
                {FIELDS.map((field) =>
                  field.multiline ? (
                    <div key={field.key}>
                      <Label htmlFor={`moq-${field.key}`}>{field.label}</Label>
                      <Textarea
                        id={`moq-${field.key}`}
                        rows={3}
                        defaultValue={section[field.key] as string}
                        onBlur={(e) => void handleUpdate({ [field.key]: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div key={field.key}>
                      <Label htmlFor={`moq-${field.key}`}>{field.label}</Label>
                      <Input
                        id={`moq-${field.key}`}
                        defaultValue={section[field.key] as string}
                        onBlur={(e) => void handleUpdate({ [field.key]: e.target.value })}
                      />
                    </div>
                  ),
                )}
                <div>
                  <Label htmlFor="moq-cta-href">CTA — Button URL</Label>
                  <Input
                    id="moq-cta-href"
                    defaultValue={section.cta_button_href}
                    placeholder="/contact#request-quotation"
                    onBlur={(e) => void handleUpdate({ cta_button_href: e.target.value })}
                  />
                  <p className="mt-1 text-small text-neutral-500">
                    Tidak diterjemahkan — URL/anchor bukan konten berbahasa.
                  </p>
                </div>
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
