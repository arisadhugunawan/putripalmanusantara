"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import type {
  ArticleCategory,
  ArticleContentSource,
  ArticleDetail,
  ArticleStatistic,
  ArticleSummary,
  Locale,
  Media,
  Translations,
} from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DocumentPreviewModal } from "@/components/admin/DocumentPreviewModal";
import { InstagramPreviewPanel } from "@/components/admin/InstagramPreviewPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { PublishConfirmModal } from "@/components/admin/PublishConfirmModal";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { Skeleton } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";

type ArticleTranslatableField = "title" | "excerpt" | "content" | "metaTitle" | "metaDescription" | "quoteText";

/** Collapsible per-locale translation block shared by the three cards below — one field group
 * per card (Website Content / Premium Editorial Blocks / SEO), all writing into the same
 * `Article.translations` JSON column. Mirrors the Phase 5E-A/5E-B `TranslationsBlock` pattern:
 * every panel stays mounted (LocaleTabs' own contract), so a locale switch never discards an
 * in-progress edit in another tab. */
function ArticleTranslationsBlock({
  translations,
  onUpdate,
  base,
  fields,
}: {
  translations: Translations | null | undefined;
  onUpdate: (locale: Exclude<Locale, "en">, field: ArticleTranslatableField, value: string) => void;
  base: Record<string, string>;
  fields: Array<{
    key: ArticleTranslatableField;
    label: string;
    englishValue: string;
    kind?: "input" | "textarea" | "richtext";
  }>;
}) {
  return (
    <details className="mt-4 border-t border-neutral-100 pt-4">
      <summary className="flex cursor-pointer items-center gap-2 text-small font-medium text-neutral-700">
        🌐 Translations
        <TranslationStatusBadges translations={translations} base={base} />
      </summary>
      <div className="mt-3">
        <LocaleTabs>
          {(locale) =>
            locale === "en" ? (
              <p className="text-small text-neutral-500">
                Bahasa Inggris diedit langsung pada field-field di atas.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {fields.map((field) => {
                  const value = translations?.[locale]?.[field.key] ?? "";
                  if (field.kind === "richtext") {
                    return (
                      <div key={field.key}>
                        <Label className="text-small">{field.label}</Label>
                        <RichTextEditor content={value} onChange={(html) => onUpdate(locale, field.key, html)} />
                      </div>
                    );
                  }
                  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    onUpdate(locale, field.key, e.target.value);
                  return (
                    <div key={field.key}>
                      <Label className="text-small">{field.label}</Label>
                      {field.kind === "textarea" ? (
                        <Textarea rows={2} defaultValue={value} placeholder={field.englishValue} onBlur={onBlur} />
                      ) : (
                        <Input defaultValue={value} placeholder={field.englishValue} onBlur={onBlur} />
                      )}
                    </div>
                  );
                })}
                <p className="text-small text-neutral-500">
                  Kosongkan untuk memakai teks Inggris sebagai fallback.
                </p>
              </div>
            )
          }
        </LocaleTabs>
      </div>
    </details>
  );
}

function captionToHtml(caption: string): string {
  return caption
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string;
  author: string;
  featured: boolean;
  contentSource: ArticleContentSource;
  instagramCaption: string;
  instagramUrl: string;
  instagramDate: string;
  instagramUsername: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  keyTakeaways: string;
  quoteText: string;
  quoteAuthor: string;
  statistics: ArticleStatistic[];
  readingTimeOverride: string;
  translations: Translations | null;
}

function toFormState(article: ArticleDetail): FormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    categoryId: article.category?.id ?? "",
    tags: article.tags.join(", "),
    author: article.author,
    featured: article.featured,
    contentSource: article.content_source,
    instagramCaption: article.instagram_caption ?? "",
    instagramUrl: article.instagram_url ?? "",
    instagramDate: article.instagram_date ? article.instagram_date.slice(0, 10) : "",
    instagramUsername: article.instagram_username ?? "",
    metaTitle: article.meta_title ?? "",
    metaDescription: article.meta_description ?? "",
    canonicalUrl: article.canonical_url ?? "",
    focusKeyword: article.focus_keyword ?? "",
    keyTakeaways: article.key_takeaways.join("\n"),
    quoteText: article.quote_text ?? "",
    quoteAuthor: article.quote_author ?? "",
    statistics: article.statistics,
    readingTimeOverride: article.reading_time_override != null ? String(article.reading_time_override) : "",
    translations: article.translations ?? null,
  };
}

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const fetchArticle = useCallback(() => adminApi.get<ArticleDetail>(`/admin/articles/${id}`), [id]);
  const { data: article, status: loadStatus, reload, retry } = useAdminResource(fetchArticle);
  const fetchCategories = useCallback(() => adminApi.get<ArticleCategory[]>("/admin/articles/categories"), []);
  const { data: categories } = useAdminResource(fetchCategories);

  const [form, setForm] = useState<FormState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const { status: saveStatus, error: saveError, run } = useSaveState();

  useEffect(() => {
    // Syncing local form state from a freshly (re)loaded server record is exactly this
    // effect's job; `dirty` guards it from clobbering in-progress edits on background
    // reloads triggered by image/gallery actions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (article && !dirty) setForm(toFormState(article));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  // Brief §26 — warn on browser tab close/refresh with unsaved changes; in-app navigation is
  // intercepted via the "← Kembali" button below instead (App Router has no route-change
  // blocker API to hook into).
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  // Save-safety: merges only the edited locale/field into the existing `translations` object
  // held in local form state — never overwrites the other five locales. Same contract as the
  // Phase 5E-A/5E-B pattern; the difference here is this editor batches everything into one
  // Save Draft/Publish click rather than saving per-field on blur, so the merge happens in
  // local state and the *whole* merged object is sent on the next persist() call.
  function updateTranslation(locale: Exclude<Locale, "en">, field: ArticleTranslatableField, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const current = prev.translations ?? {};
      return { ...prev, translations: { ...current, [locale]: { ...current[locale], [field]: value } } };
    });
    setDirty(true);
  }

  function updateStatistic(index: number, patch: Partial<ArticleStatistic>) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = prev.statistics.map((s, i) => (i === index ? { ...s, ...patch } : s));
      return { ...prev, statistics: next };
    });
    setDirty(true);
  }

  function addStatistic() {
    setForm((prev) => (prev ? { ...prev, statistics: [...prev.statistics, { value: "", label: "" }] } : prev));
    setDirty(true);
  }

  function removeStatistic(index: number) {
    setForm((prev) => (prev ? { ...prev, statistics: prev.statistics.filter((_, i) => i !== index) } : prev));
    setDirty(true);
  }

  function handleUseCaptionAsDraft() {
    if (!form) return;
    const html = captionToHtml(form.instagramCaption);
    if (html) update("content", html);
  }

  // Saves ordinary content fields only — `status` is never part of this call (Phase 5F-P0.2).
  // Publishing/unpublishing are separate, `@Roles('super_admin')`-gated actions below, so this
  // save can never be used to sneak a status change past that gate.
  async function persist() {
    if (!form) return null;
    return run(() =>
      adminApi.put<ArticleDetail>(`/admin/articles/${id}`, {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        category_id: form.categoryId,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        author: form.author,
        featured: form.featured,
        content_source: form.contentSource,
        instagram_caption: form.instagramCaption,
        instagram_url: form.instagramUrl,
        instagram_date: form.instagramDate ? new Date(form.instagramDate).toISOString() : undefined,
        instagram_username: form.instagramUsername,
        meta_title: form.metaTitle,
        meta_description: form.metaDescription,
        canonical_url: form.canonicalUrl,
        focus_keyword: form.focusKeyword,
        key_takeaways: form.keyTakeaways
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
        quote_text: form.quoteText,
        quote_author: form.quoteAuthor,
        statistics: form.statistics.filter((s) => s.value.trim() && s.label.trim()),
        reading_time_minutes: form.readingTimeOverride ? Number(form.readingTimeOverride) : null,
        translations: form.translations,
      }),
    );
  }

  async function handleSaveDraft() {
    const result = await persist();
    if (result?.success) {
      setDirty(false);
      await reload();
      showToast("Draft saved.");
    } else {
      showToast("Unable to save changes.", "error");
    }
  }

  // Saves any in-progress edits first (open to every admin), then calls the separate,
  // super_admin-gated publish endpoint. If the admin lacks permission, the content save still
  // succeeds — nothing is lost — but the publish step itself is rejected server-side (Phase
  // 5F-P0.2), matching the toast copy below ("your previous published version remains
  // unchanged").
  async function handleConfirmPublish() {
    setPublishing(true);
    const saveResult = await persist();
    if (!saveResult?.success) {
      setPublishing(false);
      setConfirmingPublish(false);
      showToast("Unable to save changes before publishing.", "error");
      return;
    }
    const publishResult = await run(() => adminApi.post(`/admin/articles/${id}/publish`));
    setPublishing(false);
    setConfirmingPublish(false);
    if (publishResult.success) {
      setDirty(false);
      await reload();
      showToast("Article published.");
    } else {
      showToast("Publishing failed. Your previous published version remains unchanged.", "error");
    }
  }

  async function handleConfirmUnpublish() {
    setUnpublishing(true);
    const saveResult = await persist();
    if (!saveResult?.success) {
      setUnpublishing(false);
      setConfirmingUnpublish(false);
      showToast("Unable to save changes before unpublishing.", "error");
      return;
    }
    const unpublishResult = await run(() => adminApi.post(`/admin/articles/${id}/unpublish`));
    setUnpublishing(false);
    setConfirmingUnpublish(false);
    if (unpublishResult.success) {
      setDirty(false);
      await reload();
      showToast("Article moved back to draft.");
    } else {
      showToast("Unable to unpublish. The article remains published.", "error");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/articles/${id}`);
      showToast("Content deleted successfully.");
      router.push("/admin/artikel");
    } catch {
      showToast("Unable to delete content.", "error");
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    try {
      const copy = await adminApi.post<{ id: string }>(`/admin/articles/${id}/duplicate`, {});
      showToast("Content duplicated as a new draft.");
      router.push(`/admin/artikel/${copy.id}`);
    } catch {
      showToast("Unable to duplicate content.", "error");
    }
  }

  function handleBack() {
    if (dirty) {
      setConfirmingLeave(true);
      return;
    }
    router.push("/admin/artikel");
  }

  // ── Gallery (mirrors FactoryEditor's gallery block) ─────────────────────
  async function handleAddGalleryImage(mediaId: string) {
    try {
      await adminApi.post(`/admin/articles/${id}/gallery`, { media_id: mediaId });
      await reload();
      showToast("Image uploaded.");
    } catch {
      showToast("Unable to save changes.", "error");
    }
  }

  async function handleUpdateGalleryItem(galleryId: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/articles/${id}/gallery/${galleryId}`, patch);
      await reload();
    } catch {
      showToast("Unable to save changes.", "error");
    }
  }

  async function handleReorderGallery(from: number, to: number) {
    if (!article) return;
    if (to < 0 || to >= article.gallery_images.length) return;
    const next = arrayMove(article.gallery_images, from, to);
    try {
      await Promise.all(
        next
          .map((item, index) =>
            item.order === index ? null : adminApi.put(`/admin/articles/${id}/gallery/${item.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Unable to save changes.", "error");
    }
  }

  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);
  const [previewGalleryMedia, setPreviewGalleryMedia] = useState<Media | null>(null);
  async function handleDeleteGalleryImage() {
    if (!deleteGalleryId) return;
    const galleryId = deleteGalleryId;
    setDeleteGalleryId(null);
    try {
      await adminApi.delete(`/admin/articles/${id}/gallery/${galleryId}`);
      await reload();
      showToast("Content deleted successfully.");
    } catch {
      showToast("Unable to delete content.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorderGallery(from, to));

  const cardPreview: ArticleSummary | null = useMemo(() => {
    if (!article || !form) return null;
    const category = categories?.find((c) => c.id === form.categoryId);
    return {
      id: article.id,
      slug: article.slug,
      title: form.title,
      excerpt: form.excerpt,
      cover_image: article.cover_image,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
      author: form.author,
      published_at: article.published_at,
      featured: form.featured,
      content_source: form.contentSource,
      instagram_url: form.instagramUrl || null,
    };
  }, [article, form, categories]);

  const defaultInstagramStatus = form?.instagramUrl
    ? "posted"
    : form?.contentSource === "instagram"
      ? "instagram_only"
      : "no_link";

  if (loadStatus === "error") {
    return <AdminLoadError message="Gagal memuat artikel." onRetry={() => void retry()} />;
  }
  if (loadStatus === "loading" || !article || !form) {
    return (
      <div className="max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={handleBack} className="text-small text-primary-700 underline">
            ← Kembali ke Artikel
          </button>
          <h1 className="mt-1 text-h2 text-neutral-900">Ubah Konten</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-small">
          <Badge variant={article.status === "published" ? "primary" : "neutral"}>
            {article.status === "published" ? "Published" : "Draft"}
          </Badge>
          <a href={`/admin/preview/artikel/${id}`} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
            Preview Website
          </a>
          <button type="button" onClick={() => setShowCardPreview(true)} className="text-primary-700 underline">
            Preview Homepage Card
          </button>
          <button type="button" onClick={() => void handleDuplicate()} className="text-neutral-600 underline">
            Duplicate
          </button>
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-red-600 underline">
            Delete
          </button>
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Website Content</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Website Article Title</Label>
              <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="excerpt">Short Description / Excerpt</Label>
            <Textarea id="excerpt" rows={2} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} required />
            <p className="mt-1 text-small text-neutral-500">{form.excerpt.length} karakter (disarankan 120–180).</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
              >
                <option value="">Belum dipilih</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
              <Input id="tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="coconut, export, Indonesia" />
            </div>
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={form.author} onChange={(e) => update("author", e.target.value)} />
          </div>
          <div>
            <Label>Article Content</Label>
            <RichTextEditor content={form.content} onChange={(html) => update("content", html)} />
          </div>
          <label className="flex items-center gap-2 text-body text-neutral-700">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} className="h-4 w-4" />
            Featured
          </label>
        </div>

        <ArticleTranslationsBlock
          translations={form.translations}
          onUpdate={updateTranslation}
          base={{ title: form.title, excerpt: form.excerpt, content: form.content }}
          fields={[
            { key: "title", label: "Website Article Title", englishValue: form.title, kind: "input" },
            { key: "excerpt", label: "Short Description / Excerpt", englishValue: form.excerpt, kind: "textarea" },
            { key: "content", label: "Article Content", englishValue: "", kind: "richtext" },
          ]}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Premium Editorial Blocks (opsional)</h2>
        <p className="mt-1 text-small text-neutral-600">
          Elemen tambahan untuk tampilan Article Detail Page premium — semuanya opsional dan tidak akan tampil
          bila dikosongkan.
        </p>
        <div className="mt-4 flex flex-col gap-6">
          <div>
            <Label htmlFor="reading-time">Reading Time (menit, opsional)</Label>
            <Input
              id="reading-time"
              type="number"
              min={1}
              max={60}
              value={form.readingTimeOverride}
              onChange={(e) => update("readingTimeOverride", e.target.value)}
              placeholder={`Otomatis: ${article.reading_time_minutes} menit`}
              className="max-w-40"
            />
            <p className="mt-1 text-small text-neutral-500">
              Kosongkan untuk dihitung otomatis dari jumlah kata konten.
            </p>
          </div>

          <div>
            <Label htmlFor="key-takeaways">Key Takeaways (satu poin per baris, opsional)</Label>
            <Textarea
              id="key-takeaways"
              rows={4}
              value={form.keyTakeaways}
              onChange={(e) => update("keyTakeaways", e.target.value)}
              placeholder={"Reliable local sourcing\nQuality-focused handling\nExport-ready logistics"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="quote-text">Pull Quote (opsional)</Label>
              <Textarea
                id="quote-text"
                rows={2}
                value={form.quoteText}
                onChange={(e) => update("quoteText", e.target.value)}
                placeholder="Consistent quality begins long before the product reaches the container."
              />
            </div>
            <div>
              <Label htmlFor="quote-author">Atribusi Quote (opsional)</Label>
              <Input id="quote-author" value={form.quoteAuthor} onChange={(e) => update("quoteAuthor", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Insight Numbers / Statistics (opsional)</Label>
            <p className="mt-1 text-small text-neutral-500">
              Nilai apa adanya sesuai yang diisi Admin — tidak pernah dikarang oleh sistem.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {form.statistics.map((stat, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStatistic(index, { value: e.target.value })}
                    placeholder="+20"
                    className="w-28"
                  />
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStatistic(index, { label: e.target.value })}
                    placeholder="Export Markets"
                    className="max-w-56 flex-1"
                  />
                  <button type="button" onClick={() => removeStatistic(index)} className="text-small text-red-600 underline">
                    Hapus
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={addStatistic} className="mt-3 w-fit">
              + Tambah Angka
            </Button>
          </div>
        </div>

        <ArticleTranslationsBlock
          translations={form.translations}
          onUpdate={updateTranslation}
          base={{ quoteText: form.quoteText }}
          fields={[{ key: "quoteText", label: "Pull Quote", englishValue: form.quoteText, kind: "textarea" }]}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Cover &amp; Gallery Images</h2>
        <div className="mt-4 flex flex-col gap-6">
          <MediaUploadField
            label="Cover Image"
            media={article.cover_image}
            onChange={async (media) => {
              await adminApi.put(`/admin/articles/${id}`, { cover_image_id: media.id });
              await reload();
            }}
            hint="Rekomendasi Instagram: 1080×1080, 1080×1350, atau 1080×1440px. JPG/PNG/WEBP."
            previewFit="contain"
            previewBackgroundClassName="bg-neutral-50"
          />

          <div>
            <Label>Image Gallery (opsional — untuk carousel Instagram atau galeri artikel)</Label>
            {article.gallery_images.length === 0 && (
              <p className="mt-2 text-small text-neutral-500">Belum ada gambar galeri.</p>
            )}
            <div className="mt-2 flex flex-col gap-3">
              {article.gallery_images.map((item, index) => {
                const rowProps = getRowProps(index);
                return (
                  <div
                    key={item.id}
                    {...rowProps}
                    className={cn(
                      "flex flex-wrap items-start gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                      rowProps.className,
                    )}
                  >
                    <span {...getHandleProps(index)}>
                      <DragHandle />
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewGalleryMedia(item.media)}
                      aria-label={`Lihat gambar penuh: ${item.media.alt_text}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-50 transition hover:opacity-80"
                    >
                      <Image src={item.media.file_url} alt={item.media.alt_text} fill sizes="80px" className="object-cover" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Caption (opsional)"
                          defaultValue={item.caption ?? ""}
                          onBlur={(e) => void handleUpdateGalleryItem(item.id, { caption: e.target.value })}
                        />
                        <Input
                          placeholder="Alt text (opsional)"
                          defaultValue={item.alt_text ?? ""}
                          onBlur={(e) => void handleUpdateGalleryItem(item.id, { alt_text: e.target.value })}
                        />
                      </div>
                      <div className="mt-2 flex gap-3 text-small">
                        <button type="button" onClick={() => void handleReorderGallery(index, index - 1)} disabled={index === 0} className="text-neutral-600 underline disabled:opacity-30">
                          Naik
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReorderGallery(index, index + 1)}
                          disabled={index === article.gallery_images.length - 1}
                          className="text-neutral-600 underline disabled:opacity-30"
                        >
                          Turun
                        </button>
                        <button type="button" onClick={() => setDeleteGalleryId(item.id)} className="ml-auto text-red-600 underline">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <MediaUploadField
                label="+ Add Image"
                media={null}
                onChange={(media) => void handleAddGalleryImage(media.id)}
                hint="Bisa diunggah berkali-kali untuk carousel."
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Instagram Source</h2>
        <p className="mt-1 text-small text-neutral-600">
          Materi asal dari Instagram — disimpan terpisah dari konten website di atas, tidak pernah ditampilkan
          sebagai isi artikel.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-2">Content Source</Label>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    { value: "website", label: "Website Article" },
                    { value: "instagram", label: "Instagram Post" },
                    { value: "both", label: "Both" },
                  ] as { value: ArticleContentSource; label: string }[]
                ).map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-body">
                    <input
                      type="radio"
                      name="content-source"
                      checked={form.contentSource === option.value}
                      onChange={() => update("contentSource", option.value)}
                      className="h-4 w-4"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="ig-caption">Instagram Caption</Label>
              <Textarea id="ig-caption" rows={5} value={form.instagramCaption} onChange={(e) => update("instagramCaption", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ig-url">Instagram URL (opsional)</Label>
                <Input id="ig-url" value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} placeholder="https://www.instagram.com/p/..." />
              </div>
              <div>
                <Label htmlFor="ig-date">Instagram Post Date (opsional)</Label>
                <Input id="ig-date" type="date" value={form.instagramDate} onChange={(e) => update("instagramDate", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ig-username">Instagram Username (opsional)</Label>
                <Input id="ig-username" value={form.instagramUsername} onChange={(e) => update("instagramUsername", e.target.value)} />
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={handleUseCaptionAsDraft} className="w-fit">
              Use Caption as Draft
            </Button>
          </div>
          <InstagramPreviewPanel image={article.cover_image} caption={form.instagramCaption} username={form.instagramUsername} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">SEO</h2>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="meta-title">SEO Title (opsional)</Label>
            <Input id="meta-title" value={form.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} placeholder={form.title} />
          </div>
          <div>
            <Label htmlFor="meta-description">Meta Description (opsional)</Label>
            <Textarea id="meta-description" rows={2} value={form.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} placeholder={form.excerpt} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="focus-keyword">Focus Keyword (opsional)</Label>
              <Input id="focus-keyword" value={form.focusKeyword} onChange={(e) => update("focusKeyword", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="canonical-url">Canonical URL (opsional)</Label>
              <Input id="canonical-url" value={form.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} />
            </div>
          </div>
          <MediaUploadField
            label="Open Graph Image (opsional — default memakai Cover Image)"
            media={article.og_image}
            onChange={async (media) => {
              await adminApi.put(`/admin/articles/${id}`, { og_image_id: media.id });
              await reload();
            }}
            onRemove={async () => {
              await adminApi.put(`/admin/articles/${id}`, { og_image_id: "" });
              await reload();
            }}
          />
        </div>

        <ArticleTranslationsBlock
          translations={form.translations}
          onUpdate={updateTranslation}
          base={{ metaTitle: form.metaTitle, metaDescription: form.metaDescription }}
          fields={[
            { key: "metaTitle", label: "SEO Title", englishValue: form.metaTitle || form.title, kind: "input" },
            {
              key: "metaDescription",
              label: "Meta Description",
              englishValue: form.metaDescription || form.excerpt,
              kind: "textarea",
            },
          ]}
        />
        <p className="mt-2 text-small text-neutral-500">
          Focus Keyword dan Canonical URL tidak diterjemahkan — keduanya properti dari URL/target pencarian,
          sama di semua bahasa.
        </p>
      </Card>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 rounded-card border border-neutral-200 bg-white p-4 shadow-card">
        <Button type="button" variant="secondary" onClick={() => void handleSaveDraft()} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Menyimpan..." : "Save Draft"}
        </Button>
        {article.status === "published" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmingUnpublish(true)}
            disabled={saveStatus === "saving"}
          >
            Unpublish
          </Button>
        ) : (
          <Button type="button" onClick={() => setConfirmingPublish(true)} disabled={saveStatus === "saving"}>
            Publish
          </Button>
        )}
        <SaveStateIndicator status={saveStatus} error={saveError} />
      </div>

      {confirmingPublish && (
        <PublishConfirmModal
          defaultInstagramStatus={defaultInstagramStatus}
          confirming={publishing}
          onConfirm={() => void handleConfirmPublish()}
          onCancel={() => setConfirmingPublish(false)}
        />
      )}

      {confirmingUnpublish && (
        <ConfirmDialog
          title="Move this article back to draft?"
          message="It will be removed from the public News & Articles page and Homepage until you publish it again."
          confirmLabel={unpublishing ? "Unpublishing..." : "Unpublish"}
          cancelLabel="Stay Published"
          onConfirm={() => {
            if (!unpublishing) void handleConfirmUnpublish();
          }}
          onCancel={() => setConfirmingUnpublish(false)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this content?"
          message="This action cannot be undone."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          onConfirm={() => {
            if (!deleting) void handleDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {deleteGalleryId && (
        <ConfirmDialog
          title="Delete this content?"
          message="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => void handleDeleteGalleryImage()}
          onCancel={() => setDeleteGalleryId(null)}
        />
      )}

      {previewGalleryMedia && (
        <DocumentPreviewModal
          media={previewGalleryMedia}
          fileSize={null}
          onClose={() => setPreviewGalleryMedia(null)}
        />
      )}

      {confirmingLeave && (
        <ConfirmDialog
          title="You have unsaved changes."
          message="Perubahan yang belum disimpan akan hilang jika Anda meninggalkan halaman ini."
          confirmLabel="Leave Without Saving"
          cancelLabel="Stay"
          onConfirm={() => router.push("/admin/artikel")}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}

      {showCardPreview && cardPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preview Homepage Card"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
          onClick={() => setShowCardPreview(false)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-center text-small font-medium text-white">Preview — Insight &amp; Articles</p>
            <ArticleCard article={cardPreview} />
          </div>
        </div>
      )}
    </div>
  );
}
