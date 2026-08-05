"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

// FR-CMS-04 — tambah artikel baru.
export default function NewArticlePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const created = await adminApi.post<{ id: string }>("/admin/articles", {
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        content,
        category: formData.get("category") || undefined,
        status: formData.get("status"),
      });
      router.push(`/admin/artikel/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan artikel.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-neutral-900">Tambah Artikel</h1>
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Judul</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" name="slug" required />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Ringkasan</Label>
            <Textarea id="excerpt" name="excerpt" rows={2} required />
          </div>

          <div>
            <Label htmlFor="category">Kategori (opsional)</Label>
            <Input id="category" name="category" />
          </div>

          <div>
            <Label>Konten</Label>
            <RichTextEditor content={content} onChange={setContent} />
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

          {error && <p className="text-small text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting} className="mt-2 w-fit">
            {submitting ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
