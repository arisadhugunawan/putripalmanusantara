"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { HomepageWhyChooseUs, HomepageWhyChooseUsIcon } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

const WHY_CHOOSE_US_ICONS: { value: HomepageWhyChooseUsIcon; label: string }[] = [
  { value: "quality", label: "Quality (badge)" },
  { value: "supply", label: "Supply (gudang/paket)" },
  { value: "export_ready", label: "Export Ready (globe)" },
  { value: "consistency", label: "Consistency (centang bulat)" },
  { value: "sustainability", label: "Sustainability (daun)" },
  { value: "service", label: "Service (headset)" },
  { value: "pricing", label: "Pricing (label harga)" },
  { value: "delivery", label: "Delivery (truk)" },
];


export function WhyChooseUsEditor() {
  const [items, setItems] = useState<HomepageWhyChooseUs[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageWhyChooseUs[]>("/admin/homepage/why-choose-us");
    setItems(data);
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
      await adminApi.post("/admin/homepage/why-choose-us", {
        icon: formData.get("icon"),
        title: formData.get("title"),
        order: items?.length ?? 0,
        enabled: true,
        featured: true,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah item Why Choose Us.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/why-choose-us/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus item Why Choose Us ini?")) return;
    await adminApi.delete(`/admin/homepage/why-choose-us/${id}`);
    await load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!items) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await Promise.all([
      adminApi.put(`/admin/homepage/why-choose-us/${a.id}`, { order: b.order }),
      adminApi.put(`/admin/homepage/why-choose-us/${b.id}`, { order: a.order }),
    ]);
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Why Choose Us? (Ikon + Judul Singkat)</h2>
      <p className="mt-1 text-small text-neutral-600">
        Kartu ikon + judul singkat di beranda — tanpa deskripsi (bukan kartu produk/blog).
        &ldquo;Aktif&rdquo; menyimpan data di Admin; &ldquo;Featured&rdquo; adalah saklar
        terpisah yang benar-benar menampilkannya di beranda.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {items?.map((item, index) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3">
            <select
              defaultValue={item.icon}
              onChange={(e) => void handleUpdate(item.id, { icon: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {WHY_CHOOSE_US_ICONS.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
            <Input
              className="max-w-[220px]"
              defaultValue={item.title}
              onBlur={(e) => void handleUpdate(item.id, { title: e.target.value })}
            />
            <label className="flex items-center gap-2 text-small text-neutral-600">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => void handleUpdate(item.id, { enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Aktif
            </label>
            <label className="flex items-center gap-2 text-small text-neutral-600">
              <input
                type="checkbox"
                checked={item.featured}
                onChange={(e) => void handleUpdate(item.id, { featured: e.target.checked })}
                className="h-4 w-4"
              />
              Featured
            </label>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => void handleMove(index, -1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                Naik
              </button>
              <button
                type="button"
                onClick={() => void handleMove(index, 1)}
                disabled={index === (items?.length ?? 0) - 1}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Turun
              </button>
              <button type="button" onClick={() => void handleDelete(item.id)} className="text-small text-red-600 underline">
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Tambah Item</p>
        <div>
          <Label htmlFor="new-why-choose-us-icon">Ikon</Label>
          <select id="new-why-choose-us-icon" name="icon" className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body">
            {WHY_CHOOSE_US_ICONS.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {icon.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-why-choose-us-title">Judul Singkat</Label>
          <Input id="new-why-choose-us-title" name="title" required placeholder="Contoh: PREMIUM QUALITY" />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Item
        </Button>
      </form>
    </Card>
  );
}
