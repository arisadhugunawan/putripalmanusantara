"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { HomepageStatistic } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

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
        statistics: stats.map((s, index) => ({ label: s.label, value: s.value, order: index })),
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
          <div key={stat.id} className="flex items-end gap-3">
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
