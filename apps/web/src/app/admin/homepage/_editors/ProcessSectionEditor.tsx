"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepageProcessSection, Locale } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";

export function ProcessSectionEditor() {
  const [section, setSection] = useState<HomepageProcessSection | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageProcessSection>("/admin/production-steps/section");
    setSection(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/production-steps/section", patch);
    setSavedMessage("Tersimpan.");
    await load();
    setTimeout(() => setSavedMessage(null), 2000);
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

  if (!section) return null;

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Judul &amp; CTA Penutup Our Supply &amp; Export Process</h2>
      <p className="mt-1 text-small text-neutral-600">
        Teks header di atas flowchart dan CTA penutup yang tampil setelah tahap terakhir. Section
        ini otomatis tersembunyi di beranda selama belum ada tahap proses yang &ldquo;Aktif&rdquo;
        (lihat kartu di bawah).
      </p>

      <div className="mt-4">
        <Label htmlFor="ps-eyebrow">Eyebrow</Label>
        <Input id="ps-eyebrow" defaultValue={section.eyebrow} onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ps-heading">Heading</Label>
        <Input id="ps-heading" defaultValue={section.heading} onBlur={(e) => void handleUpdate({ heading: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ps-description">Deskripsi</Label>
        <Textarea
          id="ps-description"
          rows={2}
          defaultValue={section.description}
          onBlur={(e) => void handleUpdate({ description: e.target.value })}
        />
      </div>

      <details className="mt-4 border-t border-neutral-100 pt-4">
        <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
          🌐 Translations
          <TranslationStatusBadges
            translations={section.translations}
            base={{ eyebrow: section.eyebrow, heading: section.heading, description: section.description }}
          />
        </summary>
        <div className="mt-3">
          <GenerateTranslationsPanel
            statusUrl="/admin/production-steps/section/translation-status"
            generateUrl="/admin/production-steps/section/translations/generate"
            onGenerated={() => void load()}
          />
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
                    <Label className="text-small">Heading</Label>
                    <Input
                      defaultValue={section.translations?.[locale]?.heading ?? ""}
                      placeholder={section.heading}
                      onBlur={(e) => void handleUpdateTranslation(locale, "heading", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Deskripsi</Label>
                    <Textarea
                      rows={2}
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

      <div className="mt-6 border-t border-neutral-100 pt-4">
        <p className="text-small font-medium text-neutral-900">CTA Penutup (setelah tahap terakhir)</p>
        <p className="mt-1 text-small text-neutral-500">
          Blok ini tidak tampil di halaman Homepage publik saat ini, jadi belum tersedia terjemahannya.
        </p>
        <div className="mt-3">
          <Label htmlFor="ps-final-heading">Judul CTA</Label>
          <Input
            id="ps-final-heading"
            defaultValue={section.final_heading}
            onBlur={(e) => void handleUpdate({ final_heading: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <Label htmlFor="ps-final-description">Deskripsi CTA</Label>
          <Textarea
            id="ps-final-description"
            rows={2}
            defaultValue={section.final_description}
            onBlur={(e) => void handleUpdate({ final_description: e.target.value })}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ps-primary-label">Tombol Utama — Label</Label>
            <Input
              id="ps-primary-label"
              defaultValue={section.primary_cta_label}
              onBlur={(e) => void handleUpdate({ primary_cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ps-primary-href">Tombol Utama — Link</Label>
            <Input
              id="ps-primary-href"
              defaultValue={section.primary_cta_href}
              onBlur={(e) => void handleUpdate({ primary_cta_href: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ps-secondary-label">Tombol Kedua — Label</Label>
            <Input
              id="ps-secondary-label"
              defaultValue={section.secondary_cta_label}
              onBlur={(e) => void handleUpdate({ secondary_cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ps-secondary-href">Tombol Kedua — Link</Label>
            <Input
              id="ps-secondary-href"
              defaultValue={section.secondary_cta_href}
              onBlur={(e) => void handleUpdate({ secondary_cta_href: e.target.value })}
            />
          </div>
        </div>
      </div>

      {savedMessage && <p className="mt-3 text-small text-primary-700">{savedMessage}</p>}
    </Card>
  );
}
