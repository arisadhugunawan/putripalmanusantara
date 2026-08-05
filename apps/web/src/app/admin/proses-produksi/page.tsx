"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { ProductionStep } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

// docs/05-api.md §4.6 — kelola tahap proses produksi (FR-PROC-01/02).
export default function AdminProductionStepsPage() {
  const [steps, setSteps] = useState<ProductionStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<ProductionStep[]>("/admin/production-steps");
    setSteps(data);
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
      await adminApi.post("/admin/production-steps", {
        title: formData.get("title"),
        description: formData.get("description"),
        order: (steps?.length ?? 0) + 1,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah tahap.");
    }
  }

  async function handleUpdate(id: string, title: string, description: string) {
    await adminApi.put(`/admin/production-steps/${id}`, { title, description });
    await load();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus tahap "${title}"?`)) return;
    await adminApi.delete(`/admin/production-steps/${id}`);
    await load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-h2 text-neutral-900">Proses Produksi</h1>
      <p className="mt-1 text-body text-neutral-600">
        Tahap ditampilkan berurutan sesuai urutan penambahan (1 = Petani, 8 = Ekspor).
      </p>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Tambah Tahap</h2>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="new-title">Judul Tahap</Label>
            <Input id="new-title" name="title" required />
          </div>
          <div>
            <Label htmlFor="new-description">Deskripsi</Label>
            <Textarea id="new-description" name="description" rows={2} required />
          </div>
          {error && <p className="text-small text-red-600">{error}</p>}
          <Button type="submit" className="w-fit">
            Tambah
          </Button>
        </form>
      </Card>

      <div className="mt-8 flex flex-col gap-6">
        {steps?.map((step, index) => (
          <Card key={step.id}>
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 font-heading font-bold text-neutral-900">
                {index + 1}
              </div>
              <div className="flex-1">
                <Label htmlFor={`title-${step.id}`} className="text-small">
                  Judul
                </Label>
                <Input
                  id={`title-${step.id}`}
                  defaultValue={step.title}
                  onBlur={(e) => void handleUpdate(step.id, e.target.value, step.description)}
                />
                <Label htmlFor={`desc-${step.id}`} className="mt-3 text-small">
                  Deskripsi
                </Label>
                <Textarea
                  id={`desc-${step.id}`}
                  defaultValue={step.description}
                  rows={2}
                  onBlur={(e) => void handleUpdate(step.id, step.title, e.target.value)}
                />
                <div className="mt-3">
                  <MediaUploadField
                    label="Ilustrasi"
                    media={step.illustration}
                    onChange={async (media) => {
                      await adminApi.put(`/admin/production-steps/${step.id}`, { illustration_id: media.id });
                      await load();
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(step.id, step.title)}
                className="shrink-0 text-small text-red-600 underline"
              >
                Hapus
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
