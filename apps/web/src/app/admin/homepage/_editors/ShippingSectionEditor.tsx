"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepageShippingSection } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

const SHIPPING_MARQUEE_SPEED_PRESETS = [
  { label: "Slow", seconds: 60 },
  { label: "Medium", seconds: 40 },
  { label: "Fast", seconds: 25 },
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

      {savedMessage && <p className="mt-3 text-small text-primary-700">{savedMessage}</p>}
    </Card>
  );
}
