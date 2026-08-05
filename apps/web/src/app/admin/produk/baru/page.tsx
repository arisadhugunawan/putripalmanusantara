"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import { PRODUCT_CATEGORIES } from "@ppn/shared-types";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

// FR-CMS-03 — tambah produk baru.
export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const created = await adminApi.post<{ id: string }>("/admin/products", {
        slug: formData.get("slug"),
        name: formData.get("name"),
        category: formData.get("category"),
        short_description: formData.get("short_description"),
        full_description: formData.get("full_description"),
        status: formData.get("status"),
        is_featured: formData.get("is_featured") === "on",
      });
      router.push(`/admin/produk/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan produk.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-neutral-900">Tambah Produk</h1>
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" name="slug" required placeholder="mis. semi-husked-coconut" />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Input id="category" name="category" list="categories" required />
            <datalist id="categories">
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div>
            <Label htmlFor="short_description">Ringkasan Singkat</Label>
            <Textarea id="short_description" name="short_description" rows={2} required />
          </div>

          <div>
            <Label htmlFor="full_description">Deskripsi Lengkap</Label>
            <Textarea id="full_description" name="full_description" rows={5} required />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input id="is_featured" name="is_featured" type="checkbox" className="h-5 w-5" />
              <Label htmlFor="is_featured" className="mb-0">
                Produk Unggulan
              </Label>
            </div>
            <div>
              <Label htmlFor="status" className="mb-0">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue="draft"
                className="ml-2 rounded-field border border-neutral-300 px-3 py-1.5 text-body"
              >
                <option value="draft">Draf</option>
                <option value="published">Diterbitkan</option>
              </select>
            </div>
          </div>

          {error && <p className="text-small text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting} className="mt-2 w-fit">
            {submitting ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
