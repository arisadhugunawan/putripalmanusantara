"use client";

import type { AboutCompanyFacilitiesFaqSection, Locale } from "@ppn/shared-types";
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
const FIELDS: { key: keyof AboutCompanyFacilitiesFaqSection; label: string; multiline?: boolean }[] = [
  { key: "eyebrow", label: "Eyebrow" },
  { key: "heading", label: "Judul" },
  { key: "description", label: "Description", multiline: true },
  { key: "cta_title", label: "CTA — Judul" },
  { key: "cta_description", label: "CTA — Deskripsi", multiline: true },
  { key: "cta_primary_label", label: "CTA — Label Tombol Primary" },
  { key: "cta_secondary_label", label: "CTA — Label Tombol Secondary" },
];

export function FacilitiesFaqSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyFacilitiesFaqSection>("/admin/about-company/facilities-faq-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/facilities-faq-section", patch);
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
    return <AdminLoadError message="Failed to load FAQ content." onRetry={() => void retry()} />;
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
        Teks pembuka, mode accordion, dan CTA di bagian bawah section &quot;FAQ&quot;. Tersimpan
        otomatis sebagai draf.
      </p>

      <div className="mt-4">
        <GenerateTranslationsPanel
          statusUrl="/admin/about-company/facilities-faq-section/translation-status"
          generateUrl="/admin/about-company/facilities-faq-section/translations/generate"
          onGenerated={() => void reload()}
        />
        <LocaleTabs>
          {(locale) =>
            locale === "en" ? (
              <div className="flex flex-col gap-4">
                {FIELDS.map((field) =>
                  field.multiline ? (
                    <div key={field.key}>
                      <Label htmlFor={`faq-${field.key}`}>{field.label}</Label>
                      <Textarea
                        id={`faq-${field.key}`}
                        rows={3}
                        defaultValue={section[field.key] as string}
                        onBlur={(e) => void handleUpdate({ [field.key]: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div key={field.key}>
                      <Label htmlFor={`faq-${field.key}`}>{field.label}</Label>
                      <Input
                        id={`faq-${field.key}`}
                        defaultValue={section[field.key] as string}
                        onBlur={(e) => void handleUpdate({ [field.key]: e.target.value })}
                      />
                    </div>
                  ),
                )}
                <div>
                  <Label htmlFor="faq-accordion-mode">Accordion Mode</Label>
                  <select
                    id="faq-accordion-mode"
                    defaultValue={section.accordion_mode}
                    onChange={(e) => void handleUpdate({ accordion_mode: e.target.value })}
                    className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                  >
                    <option value="single">Single Open (Recommended)</option>
                    <option value="multiple">Multiple Open</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="faq-cta-primary-href">CTA — URL Primary</Label>
                  <Input
                    id="faq-cta-primary-href"
                    defaultValue={section.cta_primary_href}
                    placeholder="/contact"
                    onBlur={(e) => void handleUpdate({ cta_primary_href: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="faq-cta-secondary-href">CTA — URL Secondary (WhatsApp)</Label>
                  <Input
                    id="faq-cta-secondary-href"
                    defaultValue={section.cta_secondary_href}
                    placeholder="https://wa.me/..."
                    onBlur={(e) => void handleUpdate({ cta_secondary_href: e.target.value })}
                  />
                  <p className="mt-1 text-small text-neutral-500">
                    URL/anchor tidak diterjemahkan — bukan konten berbahasa.
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
