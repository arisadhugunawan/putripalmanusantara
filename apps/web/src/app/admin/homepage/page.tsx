"use client";

import { Badge, Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { Faq, HomepageStatistic, ProductDetail } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

// FR-CMS-06 — statistik, FAQ, produk unggulan.
export default function AdminHomepagePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-h2 text-neutral-900">Homepage</h1>
      <StatisticsEditor />
      <FaqEditor />
      <FeaturedProductsEditor />
    </div>
  );
}

function StatisticsEditor() {
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

function FaqEditor() {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<Faq[]>("/admin/faqs");
    setFaqs(data);
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
      await adminApi.post("/admin/faqs", {
        question: formData.get("question"),
        answer: formData.get("answer"),
        status: "published",
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah FAQ.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus FAQ ini?")) return;
    await adminApi.delete(`/admin/faqs/${id}`);
    await load();
  }

  async function toggleStatus(faq: Faq) {
    await adminApi.put(`/admin/faqs/${faq.id}`, {
      status: faq.status === "published" ? "draft" : "published",
    });
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">FAQ</h2>
      <div className="mt-4 flex flex-col gap-3">
        {faqs?.map((faq) => (
          <div key={faq.id} className="rounded-field border border-neutral-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">{faq.question}</p>
                <p className="mt-1 text-small text-neutral-600">{faq.answer}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant={faq.status === "published" ? "primary" : "neutral"}>
                  {faq.status === "published" ? "Tampil" : "Draf"}
                </Badge>
                <button type="button" onClick={() => void toggleStatus(faq)} className="text-small text-primary-700 underline">
                  {faq.status === "published" ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button type="button" onClick={() => void handleDelete(faq.id)} className="text-small text-red-600 underline">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <div>
          <Label htmlFor="faq-question">Pertanyaan Baru</Label>
          <Input id="faq-question" name="question" required />
        </div>
        <div>
          <Label htmlFor="faq-answer">Jawaban</Label>
          <Textarea id="faq-answer" name="answer" rows={2} required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah FAQ
        </Button>
      </form>
    </Card>
  );
}

function FeaturedProductsEditor() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);

  async function load() {
    const data = await adminApi.get<ProductDetail[]>("/admin/products");
    setProducts(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function toggleFeatured(id: string, current: boolean) {
    await adminApi.put(`/admin/products/${id}/featured`, { is_featured: !current });
    await load();
  }

  return (
    <Card className="mt-6 mb-10">
      <h2 className="text-h3 text-neutral-900">Produk Unggulan</h2>
      <div className="mt-4 flex flex-col gap-2">
        {products?.map((product) => (
          <label key={product.id} className="flex items-center gap-3 text-body">
            <input
              type="checkbox"
              checked={product.is_featured}
              onChange={() => void toggleFeatured(product.id, product.is_featured)}
              className="h-5 w-5"
            />
            {product.name}
          </label>
        ))}
      </div>
    </Card>
  );
}
