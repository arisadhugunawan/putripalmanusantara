"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { ArticleDetail } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<ArticleDetail>(`/admin/articles/${id}`);
    setArticle(data);
    setContent(data.content);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      await adminApi.put(`/admin/articles/${id}`, {
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        content,
        category: formData.get("category") || undefined,
        status: formData.get("status"),
      });
      setSavedMessage("Perubahan tersimpan.");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!article) return;
    if (!confirm(`Hapus artikel "${article.title}"?`)) return;
    await adminApi.delete(`/admin/articles/${id}`);
    router.push("/admin/artikel");
  }

  if (!article) return <p className="text-body text-neutral-600">Memuat...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Ubah Artikel</h1>
        <button type="button" onClick={() => void handleDelete()} className="text-body text-red-600 underline">
          Hapus Artikel
        </button>
      </div>

      <Card className="mt-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Judul</Label>
              <Input id="title" name="title" defaultValue={article.title} required />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" name="slug" defaultValue={article.slug} required />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Ringkasan</Label>
            <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={article.excerpt} required />
          </div>

          <div>
            <Label htmlFor="category">Kategori (opsional)</Label>
            <Input id="category" name="category" defaultValue={article.category ?? ""} />
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
              defaultValue={article.status}
              className="ml-2 rounded-field border border-neutral-300 px-3 py-1.5 text-body"
            >
              <option value="draft">Draf</option>
              <option value="published">Diterbitkan</option>
            </select>
          </div>

          {error && <p className="text-small text-red-600">{error}</p>}
          {savedMessage && <p className="text-small text-primary-700">{savedMessage}</p>}

          <Button type="submit" disabled={saving} className="mt-2 w-fit">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </Card>

      <Card className="mt-6 mb-10">
        <h2 className="text-h3 text-neutral-900">Gambar Sampul</h2>
        <div className="mt-4">
          <MediaUploadField
            label="Gambar Sampul"
            media={article.cover_image}
            onChange={async (media) => {
              await adminApi.put(`/admin/articles/${id}`, { cover_image_id: media.id });
              await load();
            }}
          />
        </div>
      </Card>
    </div>
  );
}
