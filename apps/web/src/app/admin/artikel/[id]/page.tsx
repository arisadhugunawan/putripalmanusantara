"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { ArticleDetail } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [content, setContent] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

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
    const result = await run(() =>
      adminApi.put(`/admin/articles/${id}`, {
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        content,
        category: formData.get("category") || undefined,
        status: formData.get("status"),
      }),
    );
    if (result.success) await load();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/articles/${id}`);
      showToast("Artikel berhasil dihapus.");
      router.push("/admin/artikel");
    } catch {
      showToast("Gagal menghapus artikel. Silakan coba lagi.", "error");
      setDeleting(false);
    }
  }

  if (!article) return <p className="text-body text-neutral-600">Memuat...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Ubah Artikel</h1>
        <button type="button" onClick={() => setConfirmingDelete(true)} className="text-body text-red-600 underline">
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

          <div className="mt-2 flex items-center gap-4">
            <Button type="submit" disabled={status === "saving"} className="w-fit">
              {status === "saving" ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <SaveStateIndicator status={status} error={error} />
          </div>
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

      {confirmingDelete && (
        <ConfirmDialog
          title={`Hapus artikel "${article.title}"?`}
          message="Tindakan ini tidak dapat dibatalkan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
