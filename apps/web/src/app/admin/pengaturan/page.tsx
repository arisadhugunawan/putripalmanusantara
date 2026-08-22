"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { SiteSetting } from "@ppn/shared-types";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

const GROUP_LABEL: Record<string, string> = {
  general: "Umum",
  contact: "Kontak",
  seo: "SEO",
  social: "Media Sosial",
};

// FR-CMS-09 — data perusahaan, kontak, SEO default.
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<SiteSetting[]>("/admin/settings");
    setSettings(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  function updateValue(key: string, value: string) {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  }

  async function handleSaveAll() {
    setSaving(true);
    setSavedMessage(null);
    try {
      await adminApi.put("/admin/settings", {
        settings: settings.map((s) => ({ key: s.key, value: s.value, group: s.group })),
      });
      setSavedMessage("Pengaturan tersimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const key = String(formData.get("key") ?? "").trim();
    const value = String(formData.get("value") ?? "");
    const group = String(formData.get("group") ?? "general");
    if (!key) return;
    await adminApi.put("/admin/settings", {
      settings: [...settings.map((s) => ({ key: s.key, value: s.value, group: s.group })), { key, value, group }],
    });
    event.currentTarget.reset();
    await load();
  }

  const grouped = settings.reduce<Record<string, SiteSetting[]>>((acc, setting) => {
    (acc[setting.group] ??= []).push(setting);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-neutral-900">Pengaturan</h1>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-h3 text-neutral-900">Brand & Logo</h2>
            <p className="mt-1 text-small text-neutral-600">
              Kelola logo yang digunakan pada Header, Footer, dan identitas website.
            </p>
          </div>
          <Link
            href="/admin/pengaturan/brand-logo"
            className="shrink-0 text-body font-medium text-primary-700 underline underline-offset-4"
          >
            Kelola →
          </Link>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-h3 text-neutral-900">Contact Page</h2>
            <p className="mt-1 text-small text-neutral-600">
              Email, WhatsApp, jam operasional, lokasi kantor, Google Maps, media sosial, dan hero halaman Contact
              (Draft/Publish terpisah dari Pengaturan umum).
            </p>
          </div>
          <Link
            href="/admin/pengaturan/kontak"
            className="shrink-0 text-body font-medium text-primary-700 underline underline-offset-4"
          >
            Kelola →
          </Link>
        </div>
      </Card>

      {Object.entries(grouped).map(([group, items]) => (
        <Card key={group} className="mt-6">
          <h2 className="text-h3 text-neutral-900">{GROUP_LABEL[group] ?? group}</h2>
          <div className="mt-4 flex flex-col gap-4">
            {items.map((setting) => (
              <div key={setting.key}>
                <Label htmlFor={setting.key} className="text-small">
                  {setting.key}
                </Label>
                <Input
                  id={setting.key}
                  value={setting.value}
                  onChange={(e) => updateValue(setting.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="mt-6 flex items-center gap-4">
        <Button type="button" onClick={() => void handleSaveAll()} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
        </Button>
        {savedMessage && <p className="text-small text-primary-700">{savedMessage}</p>}
      </div>

      <Card className="mt-6 mb-10">
        <h2 className="text-h3 text-neutral-900">Tambah Pengaturan Baru</h2>
        <form onSubmit={handleAddSetting} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="new-key" className="text-small">
              Kunci
            </Label>
            <Input id="new-key" name="key" placeholder="mis. instagram_url" required />
          </div>
          <div>
            <Label htmlFor="new-value" className="text-small">
              Nilai
            </Label>
            <Input id="new-value" name="value" required />
          </div>
          <div>
            <Label htmlFor="new-group" className="text-small">
              Kelompok
            </Label>
            <select
              id="new-group"
              name="group"
              defaultValue="general"
              className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
            >
              <option value="general">Umum</option>
              <option value="contact">Kontak</option>
              <option value="seo">SEO</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" className="w-fit sm:col-span-3">
            Tambah
          </Button>
        </form>
      </Card>
    </div>
  );
}
