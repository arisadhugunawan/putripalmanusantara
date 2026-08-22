"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { HomepageStatistic, Locale } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";

export function StatisticsEditor() {
  const [stats, setStats] = useState<HomepageStatistic[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageStatistic[]>("/admin/homepage/statistics");
    setStats(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  function updateField(index: number, field: "label" | "value", value: string) {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function updateTranslation(index: number, locale: Exclude<Locale, "en">, field: "label" | "value", value: string) {
    setStats((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const current = s.translations ?? {};
        return {
          ...s,
          translations: { ...current, [locale]: { ...current[locale], [field]: value } },
        };
      }),
    );
  }

  function addRow() {
    setStats((prev) => [...prev, { id: `new-${prev.length}`, label: "", value: "", icon: null, order: prev.length }]);
  }

  function removeRow(index: number) {
    setStats((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setSavedMessage(null);
    try {
      await adminApi.put("/admin/homepage/statistics", {
        statistics: stats.map((s, index) => ({
          label: s.label,
          value: s.value,
          order: index,
          translations: s.translations,
        })),
      });
      setSavedMessage("Statistik tersimpan.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Statistik Perusahaan</h2>
      <div className="mt-4 flex flex-col gap-3">
        {stats.map((stat, index) => (
          <div key={stat.id} className="rounded-field border border-neutral-100 p-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor={`stat-label-${index}`} className="text-small">
                  Label
                </Label>
                <Input
                  id={`stat-label-${index}`}
                  value={stat.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`stat-value-${index}`} className="text-small">
                  Nilai
                </Label>
                <Input
                  id={`stat-value-${index}`}
                  value={stat.value}
                  onChange={(e) => updateField(index, "value", e.target.value)}
                />
              </div>
              <button type="button" onClick={() => removeRow(index)} className="text-small text-red-600 underline">
                Hapus
              </button>
            </div>

            <details className="mt-3 border-t border-neutral-100 pt-3">
              <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
                🌐 Translations
                <TranslationStatusBadges
                  translations={stat.translations}
                  base={{ label: stat.label, value: stat.value }}
                />
              </summary>
              <div className="mt-3">
                <LocaleTabs>
                  {(locale) =>
                    locale === "en" ? (
                      <p className="text-small text-neutral-500">
                        Bahasa Inggris diedit langsung pada field di atas.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="text-small">Label</Label>
                          <Input
                            value={stat.translations?.[locale]?.label ?? ""}
                            placeholder={stat.label}
                            onChange={(e) => updateTranslation(index, locale, "label", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-small">Nilai</Label>
                          <Input
                            value={stat.translations?.[locale]?.value ?? ""}
                            placeholder={stat.value}
                            onChange={(e) => updateTranslation(index, locale, "value", e.target.value)}
                          />
                        </div>
                        <p className="text-small text-neutral-500">
                          Kosongkan untuk memakai teks Inggris sebagai fallback. Terjemahan ikut
                          tersimpan saat &ldquo;Simpan Statistik&rdquo; diklik.
                        </p>
                      </div>
                    )
                  }
                </LocaleTabs>
              </div>
            </details>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Button type="button" variant="secondary" onClick={addRow}>
          Tambah Baris
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Statistik"}
        </Button>
        {savedMessage && <p className="text-small text-primary-700">{savedMessage}</p>}
      </div>
    </Card>
  );
}
