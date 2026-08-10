"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin/client";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useSaveState } from "@/hooks/useSaveState";

// FR-CMS-04 — tambah artikel baru.
export default function NewArticlePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const { status, error, run } = useSaveState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await run(() =>
      adminApi.post<{ id: string }>("/admin/articles", {
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        content,
        category: formData.get("category") || undefined,
        status: formData.get("status"),
      }),
    );
    if (result.success) router.push(`/admin/artikel/${result.value.id}`);
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

          <div className="mt-2 flex items-center gap-4">
            <Button type="submit" disabled={status === "saving"} className="w-fit">
              {status === "saving" ? "Menyimpan..." : "Simpan & Lanjutkan"}
            </Button>
            <SaveStateIndicator status={status} error={error} />
          </div>
        </form>
      </Card>
    </div>
  );
}
