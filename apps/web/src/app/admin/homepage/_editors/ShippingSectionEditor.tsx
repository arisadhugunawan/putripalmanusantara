"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepageShippingSection, Locale } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";

// Calibrated for a "premium, unhurried" feel at the current partner-card width/count (not
// entertainment speed) — recalculate if the card size in ShippingPartnerCard.tsx or the
// number of partners changes meaningfully, since duration-based (not measured-width-based)
// marquees drift with content. 20s is also the backend's enforced minimum (UpdateShippingSectionDto
// — a deliberate floor against an overly fast/dizzying marquee), so "Fast" can't go below it.
const SHIPPING_MARQUEE_SPEED_PRESETS = [
  { label: "Slow", seconds: 45 },
  { label: "Medium", seconds: 30 },
  { label: "Fast", seconds: 20 },
];

export function ShippingSectionEditor() {
  const [section, setSection] = useState<HomepageShippingSection | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageShippingSection>("/admin/homepage/shipping-section");
    setSection(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/homepage/shipping-section", patch);
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
        <h2 className="text-h3 text-neutral-900">Judul &amp; Pengaturan Global Shipping Partner</h2>
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
      <p className="mt-1 text-small text-neutral-600">
        Carousel logo shipping/logistics partner di beranda, tampil setelah Global Export
        Reach. Section ini otomatis tersembunyi selama belum ada shipping partner dengan status
        &ldquo;Aktif&rdquo; dan &ldquo;Featured&rdquo; (lihat kartu di bawah).
      </p>

      <div className="mt-4">
        <Label htmlFor="ss-title">Judul</Label>
        <Input id="ss-title" defaultValue={section.title} onBlur={(e) => void handleUpdate({ title: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ss-subtitle">Subjudul</Label>
        <Textarea
          id="ss-subtitle"
          rows={2}
          defaultValue={section.subtitle}
          onBlur={(e) => void handleUpdate({ subtitle: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <Label className="text-small">Kecepatan Marquee</Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {SHIPPING_MARQUEE_SPEED_PRESETS.map((preset) => (
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
              min={20}
              max={120}
              defaultValue={section.marquee_duration_seconds}
              onBlur={(e) => void handleUpdate({ marquee_duration_seconds: Number(e.target.value) })}
              className="w-20 rounded-field border border-neutral-300 px-2 py-1"
            />
          </label>
        </div>
        <p className="mt-1 text-small text-neutral-500">Direkomendasikan gerakan lambat/premium — 40–60 detik per siklus penuh.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-neutral-100 pt-4">
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input
            type="checkbox"
            checked={section.show_partner_name}
            onChange={(e) => void handleUpdate({ show_partner_name: e.target.checked })}
            className="h-4 w-4"
          />
          Tampilkan Nama Partner
        </label>
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input
            type="checkbox"
            checked={section.show_relationship_type}
            onChange={(e) => void handleUpdate({ show_relationship_type: e.target.checked })}
            className="h-4 w-4"
          />
          Tampilkan Relationship Type
        </label>
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
                    <Label className="text-small">Judul</Label>
                    <Input
                      defaultValue={section.translations?.[locale]?.title ?? ""}
                      placeholder={section.title}
                      onBlur={(e) => void handleUpdateTranslation(locale, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Subjudul</Label>
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
