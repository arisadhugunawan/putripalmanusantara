"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepageExportReach } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

export function ExportReachSectionEditor() {
  const [section, setSection] = useState<HomepageExportReach | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageExportReach>("/admin/homepage/export-reach-section");
    setSection(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/homepage/export-reach-section", patch);
    await load();
  }

  if (!section) return null;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 text-neutral-900">Judul &amp; Subjudul Global Export Reach</h2>
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
        Peta ekspor interaktif di beranda, tampil setelah News &amp; Articles. Section ini
        otomatis tersembunyi selama belum ada negara tujuan ekspor dengan status &ldquo;Active
        Destination&rdquo; dan &ldquo;Aktif&rdquo; (lihat kartu di bawah).
      </p>
      <div className="mt-4">
        <Label htmlFor="er-heading">Judul</Label>
        <Input id="er-heading" defaultValue={section.heading} onBlur={(e) => void handleUpdate({ heading: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="er-subtitle">Subjudul</Label>
        <Textarea
          id="er-subtitle"
          rows={2}
          defaultValue={section.subtitle}
          onBlur={(e) => void handleUpdate({ subtitle: e.target.value })}
        />
      </div>
    </Card>
  );
}
