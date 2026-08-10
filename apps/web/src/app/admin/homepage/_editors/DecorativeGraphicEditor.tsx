"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { DecorativeGraphic, DecorativeGraphicPlacement, DecorativeGraphicVariant } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

const DECORATIVE_PLACEMENTS: { value: DecorativeGraphicPlacement; label: string }[] = [
  { value: "hero_behind_content", label: "Di Belakang Konten Hero" },
  { value: "center_background", label: "Tengah Latar Belakang" },
  { value: "top_left", label: "Kiri Atas" },
  { value: "top_right", label: "Kanan Atas" },
  { value: "bottom_left", label: "Kiri Bawah" },
  { value: "bottom_right", label: "Kanan Bawah" },
];


const DECORATIVE_VARIANTS: { value: DecorativeGraphicVariant; label: string }[] = [
  { value: "leaf_outline", label: "Leaf Outline" },
  { value: "coconut_cross_section", label: "Coconut Cross-Section" },
  { value: "ship_outline", label: "Ship Outline" },
  { value: "compass", label: "Compass" },
  { value: "world_map_outline", label: "World Map Outline" },
  { value: "palm_leaf", label: "Palm Leaf" },
  { value: "coconut_tree_silhouette", label: "Coconut Tree Silhouette" },
];


export function DecorativeGraphicEditor() {
  const [graphics, setGraphics] = useState<DecorativeGraphic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<DecorativeGraphic[]>("/admin/homepage/decorative-graphics");
    setGraphics(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    try {
      await adminApi.post("/admin/homepage/decorative-graphics", {
        variant: formData.get("variant"),
        placement: formData.get("placement"),
        opacity: Number(formData.get("opacity")),
        scale: Number(formData.get("scale")),
        order: graphics?.length ?? 0,
        enabled: true,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah elemen dekoratif.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/decorative-graphics/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus elemen dekoratif ini?")) return;
    await adminApi.delete(`/admin/homepage/decorative-graphics/${id}`);
    await load();
  }

  return (
    <Card className="mt-6 mb-10">
      <h2 className="text-h3 text-neutral-900">Elemen Dekoratif (Watermark)</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ilustrasi garis (line-art) transparan beropasitas rendah untuk aksen visual di
        beranda. Saat ini hanya dirender di halaman beranda (page = &ldquo;home&rdquo;).
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {graphics?.map((graphic) => (
          <div key={graphic.id} className="flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3">
            <select
              defaultValue={graphic.variant}
              onChange={(e) => void handleUpdate(graphic.id, { variant: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {DECORATIVE_VARIANTS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              defaultValue={graphic.placement}
              onChange={(e) => void handleUpdate(graphic.id, { placement: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {DECORATIVE_PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-small text-neutral-600">
              Opasitas
              <input
                type="number"
                min={0}
                max={0.1}
                step={0.01}
                defaultValue={graphic.opacity}
                onBlur={(e) => void handleUpdate(graphic.id, { opacity: Number(e.target.value) })}
                className="w-16 rounded-field border border-neutral-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-1 text-small text-neutral-600">
              Skala
              <input
                type="number"
                min={0.5}
                max={2}
                step={0.1}
                defaultValue={graphic.scale}
                onBlur={(e) => void handleUpdate(graphic.id, { scale: Number(e.target.value) })}
                className="w-16 rounded-field border border-neutral-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-small text-neutral-600">
              <input
                type="checkbox"
                checked={graphic.enabled}
                onChange={(e) => void handleUpdate(graphic.id, { enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Aktif
            </label>
            <button type="button" onClick={() => void handleDelete(graphic.id)} className="ml-auto text-small text-red-600 underline">
              Hapus
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div>
          <Label htmlFor="new-decor-variant" className="text-small">
            Ilustrasi
          </Label>
          <select id="new-decor-variant" name="variant" className="rounded-field border border-neutral-300 px-3 py-2.5 text-body">
            {DECORATIVE_VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-decor-placement" className="text-small">
            Posisi
          </Label>
          <select id="new-decor-placement" name="placement" className="rounded-field border border-neutral-300 px-3 py-2.5 text-body">
            {DECORATIVE_PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-decor-opacity" className="text-small">
            Opasitas
          </Label>
          <Input id="new-decor-opacity" name="opacity" type="number" min={0} max={0.1} step={0.01} defaultValue={0.06} className="w-20" />
        </div>
        <div>
          <Label htmlFor="new-decor-scale" className="text-small">
            Skala
          </Label>
          <Input id="new-decor-scale" name="scale" type="number" min={0.5} max={2} step={0.1} defaultValue={1} className="w-20" />
        </div>
        <Button type="submit">Tambah</Button>
      </form>
      {error && <p className="mt-2 text-small text-red-600">{error}</p>}
    </Card>
  );
}
