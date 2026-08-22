"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepageSupplyNetworkSection } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

export function SupplyNetworkSectionEditor() {
  const [section, setSection] = useState<HomepageSupplyNetworkSection | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageSupplyNetworkSection>("/admin/supply-network/section");
    setSection(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/supply-network/section", patch);
    setSavedMessage("Tersimpan.");
    await load();
    setTimeout(() => setSavedMessage(null), 2000);
  }

  if (!section) return null;

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Judul &amp; CTA Penutup Our Supply Network</h2>
      <p className="mt-1 text-small text-neutral-600">
        Teks header di atas diagram jaringan dan pernyataan penutup yang tampil setelah node
        terakhir. Section ini otomatis tersembunyi di beranda selama belum ada item yang
        &ldquo;Aktif&rdquo; (lihat kartu di bawah).
      </p>

      <div className="mt-4">
        <Label htmlFor="sn-eyebrow">Eyebrow</Label>
        <Input id="sn-eyebrow" defaultValue={section.eyebrow} onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="sn-heading">Heading</Label>
        <Input id="sn-heading" defaultValue={section.heading} onBlur={(e) => void handleUpdate({ heading: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="sn-description">Deskripsi</Label>
        <Textarea
          id="sn-description"
          rows={2}
          defaultValue={section.description}
          onBlur={(e) => void handleUpdate({ description: e.target.value })}
        />
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-4">
        <p className="text-small font-medium text-neutral-900">Node Pusat</p>
        <p className="mt-1 text-small text-neutral-600">
          Node yang selalu tampil di tengah diagram, dikelilingi oleh node-node lain.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="sn-center-label">Label Pusat</Label>
            <Input id="sn-center-label" defaultValue={section.center_label} onBlur={(e) => void handleUpdate({ center_label: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sn-center-title">Judul Pusat</Label>
            <Input id="sn-center-title" defaultValue={section.center_title} onBlur={(e) => void handleUpdate({ center_title: e.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <Label htmlFor="sn-center-description">Deskripsi Pusat (opsional)</Label>
          <Textarea
            id="sn-center-description"
            rows={2}
            defaultValue={section.center_description}
            onBlur={(e) => void handleUpdate({ center_description: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-4">
        <p className="text-small font-medium text-neutral-900">Animasi</p>
        <p className="mt-1 text-small text-neutral-600">
          Semua fitur nonaktif otomatis saat pengunjung mengaktifkan &ldquo;reduced motion&rdquo;
          di perangkatnya.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={section.enable_animation}
              onChange={(e) => void handleUpdate({ enable_animation: e.target.checked })}
              className="h-4 w-4"
            />
            Enable Animation
          </label>
          <label className="flex items-center gap-2 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={section.auto_rotate}
              onChange={(e) => void handleUpdate({ auto_rotate: e.target.checked })}
              className="h-4 w-4"
            />
            Auto Rotate
          </label>
          <label className="flex items-center gap-2 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={section.particle_flow}
              onChange={(e) => void handleUpdate({ particle_flow: e.target.checked })}
              className="h-4 w-4"
            />
            Particle Flow
          </label>
          <label className="flex items-center gap-2 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={section.hover_effect}
              onChange={(e) => void handleUpdate({ hover_effect: e.target.checked })}
              className="h-4 w-4"
            />
            Hover Effect
          </label>
          <label className="flex items-center gap-2 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={section.effect_3d}
              onChange={(e) => void handleUpdate({ effect_3d: e.target.checked })}
              className="h-4 w-4"
            />
            3D Effect
          </label>
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-4">
        <p className="text-small font-medium text-neutral-900">Pernyataan Penutup (setelah node terakhir)</p>
        <div className="mt-3">
          <Label htmlFor="sn-final-heading">Judul Penutup</Label>
          <Input
            id="sn-final-heading"
            defaultValue={section.final_heading}
            onBlur={(e) => void handleUpdate({ final_heading: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <Label htmlFor="sn-final-description">Deskripsi Penutup</Label>
          <Textarea
            id="sn-final-description"
            rows={2}
            defaultValue={section.final_description}
            onBlur={(e) => void handleUpdate({ final_description: e.target.value })}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="sn-primary-label">Tombol Utama — Label</Label>
            <Input
              id="sn-primary-label"
              defaultValue={section.primary_cta_label}
              onBlur={(e) => void handleUpdate({ primary_cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sn-primary-href">Tombol Utama — Link</Label>
            <Input
              id="sn-primary-href"
              defaultValue={section.primary_cta_href}
              onBlur={(e) => void handleUpdate({ primary_cta_href: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sn-secondary-label">Tombol Kedua — Label (opsional)</Label>
            <Input
              id="sn-secondary-label"
              defaultValue={section.secondary_cta_label}
              onBlur={(e) => void handleUpdate({ secondary_cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sn-secondary-href">Tombol Kedua — Link (opsional)</Label>
            <Input
              id="sn-secondary-href"
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
