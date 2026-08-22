"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepagePartnersSection, Locale } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";

const MARQUEE_SPEED_PRESETS = [
  { label: "Slow", seconds: 60 },
  { label: "Normal", seconds: 40 },
  { label: "Fast", seconds: 25 },
];

export function PartnersSectionEditor() {
  const [section, setSection] = useState<HomepagePartnersSection | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepagePartnersSection>("/admin/homepage/partners-section");
    setSection(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/homepage/partners-section", patch);
    setSavedMessage("Tersimpan.");
    await load();
    setTimeout(() => setSavedMessage(null), 2000);
  }

  async function handleUpdateTranslation(
    locale: Exclude<Locale, "en">,
    field: "title" | "subtitle",
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
      <div className="flex items-center justify-between">
        <h2 className="text-h3 text-neutral-900">Judul & Kecepatan Marquee Mitra</h2>
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => void handleUpdate({ enabled: e.target.checked })}
            className="h-4 w-4"
          />
          Tampilkan section ini
        </label>
      </div>

      <div className="mt-4">
        <Label htmlFor="ps-title">Label Kecil</Label>
        <Input id="ps-title" defaultValue={section.title} onBlur={(e) => void handleUpdate({ title: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ps-subtitle">Kalimat Pendukung</Label>
        <Textarea
          id="ps-subtitle"
          rows={2}
          defaultValue={section.subtitle}
          onBlur={(e) => void handleUpdate({ subtitle: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <Label className="text-small">Kecepatan Marquee</Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {MARQUEE_SPEED_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => void handleUpdate({ marquee_duration_seconds: preset.seconds })}
              className={`rounded-field border px-3 py-1.5 text-small ${
                section.marquee_duration_seconds === preset.seconds
                  ? "border-primary-600 bg-primary-50 font-medium text-primary-700"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {preset.label} ({preset.seconds}s)
            </button>
          ))}
          <label className="flex items-center gap-2 text-small text-neutral-600">
            Custom (detik):
            <input
              type="number"
              min={15}
              max={90}
              defaultValue={section.marquee_duration_seconds}
              onBlur={(e) => void handleUpdate({ marquee_duration_seconds: Number(e.target.value) })}
              className="w-20 rounded-field border border-neutral-300 px-2 py-1"
            />
          </label>
        </div>
        <p className="mt-1 text-small text-neutral-500">Direkomendasikan 35–45 detik per siklus penuh.</p>
      </div>

      <details className="mt-4 border-t border-neutral-100 pt-4">
        <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
          🌐 Translations
          <TranslationStatusBadges
            translations={section.translations}
            base={{ title: section.title, subtitle: section.subtitle }}
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
                    <Label className="text-small">Label Kecil</Label>
                    <Input
                      defaultValue={section.translations?.[locale]?.title ?? ""}
                      placeholder={section.title}
                      onBlur={(e) => void handleUpdateTranslation(locale, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Kalimat Pendukung</Label>
                    <Textarea
                      rows={2}
                      defaultValue={section.translations?.[locale]?.subtitle ?? ""}
                      placeholder={section.subtitle}
                      onBlur={(e) => void handleUpdateTranslation(locale, "subtitle", e.target.value)}
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

      {savedMessage && <p className="mt-3 text-small text-primary-700">{savedMessage}</p>}
    </Card>
  );
}
