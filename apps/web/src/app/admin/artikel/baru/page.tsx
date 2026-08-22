"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { ArticleCategory, ArticleContentSource } from "@ppn/shared-types";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { IG_IMPORT_PREFILL_KEY, type InstagramImportPrefill } from "@/components/admin/InstagramImportModal";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useSaveState } from "@/hooks/useSaveState";

/** Converts a raw caption into simple paragraph HTML, preserving line breaks/paragraphs —
 * a starting point for the website version, never the final copy (brief §8: "DO NOT
 * automatically publish. The Admin must be able to edit it first"). */
function captionToHtml(caption: string): string {
  return caption
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function suggestTitle(caption: string): string {
  const firstLine = caption.split("\n").find((line) => line.trim().length > 0) ?? "";
  return firstLine.replace(/[#*_]/g, "").trim().slice(0, 120);
}

function suggestExcerpt(caption: string): string {
  const plain = caption.replace(/\n+/g, " ").replace(/#\S+/g, "").trim();
  return plain.length > 170 ? `${plain.slice(0, 167)}...` : plain;
}

// Brief §45 STEP 1-8 — "+ Add Content": pick a source, optionally bring in Instagram material,
// then create a Draft. Everything else (rich content, SEO, gallery, publish) happens on the
// full editor page this redirects to — this page's only job is getting a Draft to exist.
export default function AddContentPage() {
  const router = useRouter();
  const [source, setSource] = useState<ArticleContentSource>("website");
  const [caption, setCaption] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [igDate, setIgDate] = useState("");
  const [igUsername, setIgUsername] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [igImportedAt, setIgImportedAt] = useState<string | undefined>(undefined);
  const { status, error, run } = useSaveState();

  const fetchCategories = useCallback(() => adminApi.get<ArticleCategory[]>("/admin/articles/categories"), []);
  const { data: categories } = useAdminResource(fetchCategories);

  // Picked up once from the "+ Import from Instagram" modal (admin/artikel/page.tsx) — a
  // fetched post lands here pre-filled but still a Draft, same as manual entry (brief §56/57:
  // import never skips the Admin's own review).
  useEffect(() => {
    const raw = sessionStorage.getItem(IG_IMPORT_PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(IG_IMPORT_PREFILL_KEY);
    try {
      const prefill = JSON.parse(raw) as InstagramImportPrefill;
      // sessionStorage only exists client-side and only after the Import modal wrote it —
      // there is no render-time value to derive this from, so a one-time synchronous
      // populate on mount (never re-fires; empty dep array) is the correct tool here rather
      // than a lazy useState initializer, which can't consume an external side-effecting read.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSource("instagram");
      setIgUrl(prefill.url ?? "");
      setCaption(prefill.caption ?? "");
      setIgUsername(prefill.username ?? "");
      setIgImportedAt(prefill.imported_at);
    } catch {
      // Malformed sessionStorage payload — ignore and leave the form at its normal defaults.
    }
  }, []);

  function handleUseCaptionAsDraft() {
    if (!title.trim()) setTitle(suggestTitle(caption));
    if (!excerpt.trim()) setExcerpt(suggestExcerpt(caption));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await run(() =>
      adminApi.post<{ id: string }>("/admin/articles", {
        title: title || "Untitled Draft",
        excerpt: excerpt || suggestExcerpt(caption) || "—",
        content: captionToHtml(caption) || "<p></p>",
        category_id: categoryId || undefined,
        content_source: source,
        instagram_caption: source !== "website" ? caption || undefined : undefined,
        instagram_url: source !== "website" ? igUrl || undefined : undefined,
        instagram_date: source !== "website" && igDate ? new Date(igDate).toISOString() : undefined,
        instagram_username: source !== "website" ? igUsername || undefined : undefined,
        instagram_imported_at: source !== "website" ? igImportedAt : undefined,
        status: "draft",
      }),
    );
    if (result.success) router.push(`/admin/artikel/${result.value.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-neutral-900">+ Add Content</h1>
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                    name="source"
                    checked={source === option.value}
                    onChange={() => setSource(option.value)}
                    className="h-4 w-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {source !== "website" && (
            <div className="flex flex-col gap-4 rounded-field border border-neutral-200 p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-h3 text-neutral-900">Instagram Post</h2>
                {igImportedAt && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-small font-medium text-primary-700">
                    Imported automatically — review before publishing
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="ig-caption">Instagram Caption</Label>
                <Textarea
                  id="ig-caption"
                  rows={6}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={"From farm to global markets 🌴\n\nPPN works with local farmers and suppliers..."}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ig-url">Instagram URL (opsional)</Label>
                  <Input id="ig-url" value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder="https://www.instagram.com/p/..." />
                </div>
                <div>
                  <Label htmlFor="ig-date">Instagram Post Date (opsional)</Label>
                  <Input id="ig-date" type="date" value={igDate} onChange={(e) => setIgDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ig-username">Instagram Username (opsional)</Label>
                  <Input id="ig-username" value={igUsername} onChange={(e) => setIgUsername(e.target.value)} placeholder="@ppn.official" />
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={handleUseCaptionAsDraft} className="w-fit">
                Use Caption as Draft
              </Button>
              <p className="text-small text-neutral-500">
                Mengisi judul &amp; ringkasan website dari caption di atas. Konten lengkap tetap bisa diedit bebas
                di halaman berikutnya — caption tidak pernah dipublikasikan apa adanya.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Website Article Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="excerpt">Short Description / Excerpt</Label>
              <Textarea id="excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required />
              <p className="mt-1 text-small text-neutral-500">{excerpt.length} karakter (disarankan 120–180).</p>
            </div>
            <div>
              <Label htmlFor="category">Category (opsional)</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
          </div>

          <p className="text-small text-neutral-500">
            Konten lengkap (rich text), gambar sampul, galeri, SEO, dan tombol Publish tersedia di halaman
            berikutnya setelah draf ini dibuat.
          </p>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={status === "saving"} className="w-fit">
              {status === "saving" ? "Membuat..." : "Create Draft"}
            </Button>
            <SaveStateIndicator status={status} error={error} />
          </div>
        </form>
      </Card>
    </div>
  );
}
