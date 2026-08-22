"use client";

import { Badge, Button, Card, cn, Input, Label, Textarea } from "@ppn/ui-components";
import {
  LOCALE_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_MEDIA_SECTION_LABELS,
  PRODUCT_MEDIA_SECTIONS,
} from "@ppn/shared-types";
import type {
  GenerateTranslationsResult,
  Media,
  ProductDetail,
  ProductTranslationStatusEntry,
  Translations,
} from "@ppn/shared-types";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { ProductsPublishHistoryCard } from "@/components/admin/ProductsPublishHistoryCard";
import { PublishProductsButton } from "@/components/admin/PublishProductsButton";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove } from "@/hooks/useDragReorder";
import { useSaveState } from "@/hooks/useSaveState";

const TRANSLATABLE_FIELDS = [
  { key: "name", label: "Nama Produk", multiline: false },
  { key: "category", label: "Kategori", multiline: false },
  { key: "shortDescription", label: "Ringkasan Singkat", multiline: true },
  { key: "fullDescription", label: "Deskripsi Lengkap", multiline: true },
] as const;

// Phase 5E-D — SEO's own translatable fields, kept as a separate LocaleTabs block from
// TRANSLATABLE_FIELDS above (and its own "🌐 SEO Translations" section) rather than merged into
// the main content block, since SEO metadata is edited and reasoned about separately from the
// product's actual body content. Both blocks read/write the SAME shared `translations` state
// declared below, so a save from either section always carries every locale's current edits —
// no separate/stale copy of the translations object exists anywhere on this page.
const SEO_TRANSLATABLE_FIELDS = [
  { key: "metaTitle", label: "Meta Title", multiline: false },
  { key: "metaDescription", label: "Meta Description", multiline: true },
] as const;

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [translations, setTranslations] = useState<Translations>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { status, error, run } = useSaveState();
  const unpublishState = useSaveState();
  const seoState = useSaveState();
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<ProductDetail>(`/admin/products/${id}`);
    setProduct(data);
    setTranslations(data.translations ?? {});
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setTranslatedField(locale: string, field: string, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale as keyof Translations], [field]: value },
    }));
  }

  async function handleSaveBasics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // `status` is intentionally not sent here — Save only ever writes the draft. Public
    // visibility changes exclusively through Publish/Unpublish below (Product Status panel).
    const result = await run(() =>
      adminApi.put(`/admin/products/${id}`, {
        slug: formData.get("slug"),
        name: formData.get("name"),
        title_accent: formData.get("title_accent"),
        category: formData.get("category"),
        short_description: formData.get("short_description"),
        full_description: formData.get("full_description"),
        is_featured: formData.get("is_featured") === "on",
        translations,
      }),
    );
    if (result.success) await load();
  }

  // Same shared `translations` state as handleSaveBasics above — a Save here always carries
  // every locale's current edits (SEO and content alike), never a stale/partial copy. Separate
  // from handleSaveBasics only so SEO has its own Save button and SaveStateIndicator, matching
  // this page's existing pattern for independent save actions (see unpublishState above).
  async function handleSaveSeo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await seoState.run(() =>
      adminApi.put(`/admin/products/${id}`, {
        meta_title: formData.get("meta_title"),
        meta_description: formData.get("meta_description"),
        translations,
      }),
    );
    if (result.success) await load();
  }

  async function handleUnpublish() {
    const result = await unpublishState.run(() =>
      adminApi.post(`/admin/products/${id}/unpublish`),
    );
    setConfirmingUnpublish(false);
    if (result.success) {
      showToast("Produk telah diturunkan dari situs publik.");
      await load();
    } else {
      showToast("Gagal menurunkan produk. Silakan coba lagi.", "error");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/products/${id}`);
      showToast("Produk berhasil dihapus.");
      router.push("/admin/produk");
    } catch {
      showToast("Gagal menghapus produk. Silakan coba lagi.", "error");
      setDeleting(false);
    }
  }

  if (!product) return <p className="text-body text-neutral-600">Memuat...</p>;

  const hasNeverPublished = !product.last_published_at;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-h2 text-neutral-900">Ubah Produk: {product.name}</h1>
        <div className="flex items-center gap-4">
          <a
            href={`/admin/preview/produk/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small font-medium text-primary-700 underline"
          >
            Preview
          </a>
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-body text-red-600 underline">
            Hapus Produk
          </button>
        </div>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-h3 text-neutral-900">Product Status</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-small text-neutral-600">
              <span className="flex items-center gap-2">
                <Badge variant={product.status === "published" ? "primary" : "neutral"}>
                  {product.status === "published" ? "Published" : "Draft"}
                </Badge>
              </span>
              <span>
                Last published:{" "}
                {product.last_published_at
                  ? new Date(product.last_published_at).toLocaleString("id-ID")
                  : "Belum pernah dipublikasikan"}
              </span>
              <span>Last edited: {new Date(product.updated_at).toLocaleString("id-ID")}</span>
              <span>
                Draft changes:{" "}
                <span className={product.has_unpublished_changes ? "font-medium text-amber-700" : "text-neutral-500"}>
                  {product.has_unpublished_changes ? "Yes" : "No"}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {product.status === "published" && (
              <button
                type="button"
                onClick={() => setConfirmingUnpublish(true)}
                disabled={unpublishState.status === "saving"}
                className="text-small font-medium text-neutral-600 underline disabled:opacity-50"
              >
                Unpublish
              </button>
            )}
            <PublishProductsButton productId={id} onPublished={() => void load()} />
          </div>
        </div>
        {hasNeverPublished && (
          <p className="mt-3 text-small text-amber-700">
            Belum pernah dipublikasikan — produk ini tidak akan muncul di situs publik atau AI Assistant
            sampai di-Publish.
          </p>
        )}
      </Card>

      {confirmingUnpublish && (
        <ConfirmDialog
          title="Unpublish this product?"
          message="Produk ini akan langsung hilang dari situs publik. Riwayat versi tidak akan hilang — Anda bisa Publish kembali kapan saja."
          confirmLabel="Unpublish"
          onConfirm={() => void handleUnpublish()}
          onCancel={() => setConfirmingUnpublish(false)}
        />
      )}

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Informasi Dasar</h2>
        <form onSubmit={handleSaveBasics} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" defaultValue={product.slug} required />
            <p className="mt-1 text-small text-neutral-600">
              Slug tidak diterjemahkan — sama untuk semua bahasa.
            </p>
          </div>

          <TranslationStatusPanel productId={product.id} />

          {/* docs README "Internationalization" — English tab binds to the real product
              columns (submitted via FormData, unchanged behavior); the other 5 tabs bind
              into the `translations` state (submitted as JSON alongside the form fields). */}
          <LocaleTabs>
            {(locale) =>
              locale === "en" ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input id="name" name="name" defaultValue={product.name} required />
                  </div>
                  <div>
                    <Label htmlFor="title_accent">Bagian Judul Beraksen (opsional)</Label>
                    <Input
                      id="title_accent"
                      name="title_accent"
                      defaultValue={product.title_accent ?? ""}
                      placeholder="mis. Coconut Shisha"
                    />
                    <p className="mt-1 text-small text-neutral-600">
                      Bagian awal dari Nama Produk yang ditampilkan dengan warna aksen di halaman detail
                      produk — harus persis sama dengan huruf pertama Nama Produk di atas, mis. jika Nama
                      Produk &quot;Coconut Shisha Charcoal Briquette&quot;, isi &quot;Coconut Shisha&quot;
                      supaya sisanya (&quot;Charcoal Briquette&quot;) tetap warna biasa. Kosongkan untuk
                      judul satu warna.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Input id="category" name="category" defaultValue={product.category} list="categories" required />
                    <datalist id="categories">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <Label htmlFor="short_description">Ringkasan Singkat</Label>
                    <Textarea
                      id="short_description"
                      name="short_description"
                      rows={2}
                      defaultValue={product.short_description}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_description">Deskripsi Lengkap</Label>
                    <Textarea
                      id="full_description"
                      name="full_description"
                      rows={5}
                      defaultValue={product.full_description}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-small text-neutral-600">
                    Terjemahan {LOCALE_LABELS[locale].name} — kosongkan untuk memakai teks
                    Inggris sebagai cadangan.
                  </p>
                  {TRANSLATABLE_FIELDS.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={`${field.key}-${locale}`}>{field.label}</Label>
                      {field.multiline ? (
                        <Textarea
                          id={`${field.key}-${locale}`}
                          rows={field.key === "fullDescription" ? 5 : 2}
                          value={translations[locale]?.[field.key] ?? ""}
                          onChange={(e) => setTranslatedField(locale, field.key, e.target.value)}
                        />
                      ) : (
                        <Input
                          id={`${field.key}-${locale}`}
                          value={translations[locale]?.[field.key] ?? ""}
                          onChange={(e) => setTranslatedField(locale, field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </LocaleTabs>

          <div className="flex items-center gap-2">
            <input
              id="is_featured"
              name="is_featured"
              type="checkbox"
              defaultChecked={product.is_featured}
              className="h-5 w-5"
            />
            <Label htmlFor="is_featured" className="mb-0">
              Produk Unggulan
            </Label>
          </div>
          <p className="-mt-2 text-small text-neutral-500">
            Perubahan pada Produk Unggulan juga baru tayang setelah di-Publish — lihat panel Product
            Status di bawah.
          </p>

          <div className="mt-2 flex items-center gap-4">
            <Button type="submit" disabled={status === "saving"} className="w-fit">
              {status === "saving" ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <SaveStateIndicator status={status} error={error} />
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">SEO</h2>
        <form onSubmit={handleSaveSeo} className="mt-4 flex flex-col gap-4">
          <p className="flex flex-wrap items-center gap-2 text-small font-medium text-neutral-700">
            🌐 SEO Translations
            <TranslationStatusBadges
              translations={translations}
              base={{ metaTitle: product.meta_title ?? "", metaDescription: product.meta_description ?? "" }}
            />
          </p>

          <LocaleTabs>
            {(locale) =>
              locale === "en" ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      name="meta_title"
                      maxLength={70}
                      defaultValue={product.meta_title ?? ""}
                      placeholder={product.name}
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      rows={2}
                      maxLength={200}
                      defaultValue={product.meta_description ?? ""}
                      placeholder={product.short_description}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-small text-neutral-600">
                    Terjemahan {LOCALE_LABELS[locale].name} — kosongkan untuk memakai teks
                    Inggris sebagai cadangan.
                  </p>
                  {SEO_TRANSLATABLE_FIELDS.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={`${field.key}-${locale}`}>{field.label}</Label>
                      {field.multiline ? (
                        <Textarea
                          id={`${field.key}-${locale}`}
                          rows={2}
                          value={translations[locale]?.[field.key] ?? ""}
                          onChange={(e) => setTranslatedField(locale, field.key, e.target.value)}
                        />
                      ) : (
                        <Input
                          id={`${field.key}-${locale}`}
                          value={translations[locale]?.[field.key] ?? ""}
                          onChange={(e) => setTranslatedField(locale, field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </LocaleTabs>

          <p className="-mt-2 text-small text-neutral-500">
            Focus Keyword dan Canonical URL tidak diterjemahkan — keduanya properti dari
            URL/target pencarian, sama di semua bahasa.
          </p>

          <div className="mt-2 flex items-center gap-4">
            <Button type="submit" disabled={seoState.status === "saving"} className="w-fit">
              {seoState.status === "saving" ? "Menyimpan..." : "Simpan SEO"}
            </Button>
            <SaveStateIndicator status={seoState.status} error={seoState.error} />
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Gambar Utama</h2>
        <div className="mt-4">
          <MediaUploadField
            label="Gambar Sampul"
            media={product.cover_image}
            hint="Rekomendasi: 1200×900px (rasio 4:3). Maksimum 5MB."
            onChange={async (media) => {
              await adminApi.put(`/admin/products/${id}`, { cover_image_id: media.id });
              await load();
            }}
          />
        </div>
      </Card>

      <ProductGallerySection productId={id} gallery={product.gallery} onChange={load} />
      <ProductShapesSection productId={id} shapes={product.shapes} onChange={load} />
      <ProductSpecificationsSection productId={id} specifications={product.specifications} onChange={load} />
      <ProductDownloadsSection productId={id} downloads={product.downloads} onChange={load} />
      <ProductPackagingSection
        productId={id}
        entries={[...product.packaging, ...product.applications]}
        onChange={load}
      />

      <ProductsPublishHistoryCard productId={id} onRestored={() => void load()} />

      {confirmingDelete && (
        <ConfirmDialog
          title={`Hapus produk "${product.name}"?`}
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

const TRANSLATION_STATUS_LABELS: Record<ProductTranslationStatusEntry["status"], string> = {
  translated: "Diterjemahkan",
  partial: "Sebagian",
  not_translated: "Belum Diterjemahkan",
};

const TRANSLATION_STATUS_STYLES: Record<ProductTranslationStatusEntry["status"], string> = {
  translated: "bg-primary-100 text-primary-700",
  partial: "bg-secondary-500/20 text-neutral-900",
  not_translated: "bg-neutral-100 text-neutral-600",
};

/** Translation coverage at a glance (brief §14 "Translation Status") — computed live from
 * whether the `translations` JSON actually has real text per locale, not a stored flag that
 * could drift out of sync. "Generate Translations" is real plumbing to a real endpoint, but
 * this project has no machine-translation provider configured anywhere, so it degrades
 * honestly (see products.service.ts `generateTranslations()`) instead of faking a result. */
function TranslationStatusPanel({ productId }: { productId: string }) {
  const fetchStatus = useCallback(
    () => adminApi.get<ProductTranslationStatusEntry[]>(`/admin/products/${productId}/translation-status`),
    [productId],
  );
  const { data: entries, status: loadStatus, reload, retry } = useAdminResource(fetchStatus);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateMessage(null);
    try {
      const result = await adminApi.post<GenerateTranslationsResult>(
        `/admin/products/${productId}/translations/generate`,
      );
      setGenerateMessage(result.message);
      await reload();
    } catch (err) {
      setGenerateMessage(err instanceof ApiRequestError ? err.message : "Gagal memeriksa status terjemahan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-field border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-body font-medium text-neutral-900">Status Terjemahan</h3>
          <p className="text-small text-neutral-600">
            Bahasa tanpa terjemahan otomatis menampilkan teks Inggris sebagai cadangan — isi tab bahasa di
            bawah untuk mengubahnya.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={generating} onClick={() => void handleGenerate()}>
          {generating ? "Memeriksa..." : "Generate Translations"}
        </Button>
      </div>

      {generateMessage && (
        <p className="mt-3 rounded-field bg-white p-3 text-small text-neutral-700">{generateMessage}</p>
      )}

      {loadStatus === "error" && <AdminLoadError message="Gagal memuat status terjemahan." onRetry={() => void retry()} />}
      {loadStatus === "loading" && <p className="mt-3 text-small text-neutral-500">Memuat...</p>}
      {loadStatus === "ready" && entries && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.map((entry) => (
            <span
              key={entry.locale}
              className={cn(
                "rounded-full px-3 py-1 text-small font-medium",
                TRANSLATION_STATUS_STYLES[entry.status],
              )}
            >
              {LOCALE_LABELS[entry.locale as keyof typeof LOCALE_LABELS]?.name ?? entry.locale.toUpperCase()} ·{" "}
              {TRANSLATION_STATUS_LABELS[entry.status]}
              {entry.status === "partial" && ` (${entry.fields_translated}/${entry.fields_total})`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductGallerySection({
  productId,
  gallery,
  onChange,
}: {
  productId: string;
  gallery: ProductDetail["gallery"];
  onChange: () => void;
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleDelete(itemId: string) {
    try {
      await adminApi.delete(`/admin/products/${productId}/gallery/${itemId}`);
      onChange();
      showToast("Foto galeri berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus foto galeri. Silakan coba lagi.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  }

  async function handleUpdate(itemId: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/products/${productId}/gallery/${itemId}`, patch);
      onChange();
    } catch {
      showToast("Gagal menyimpan perubahan media. Silakan coba lagi.", "error");
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Media Produk</h2>
      <p className="mt-1 text-small text-neutral-600">
        Foto <em>dan video</em> produk. Pilih penempatan tiap media: <strong>Galeri Produk</strong> tampil di
        rail media &amp; galeri, sedangkan <strong>Specification &amp; Lab. Test</strong> tampil sebagai
        dokumen (lembar spesifikasi / hasil uji lab) di section tersendiri.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((item) => (
          <div key={item.id} className="rounded-field border border-neutral-200 p-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-field bg-neutral-50">
              {item.media.file_type === "video" ? (
                <video src={item.media.file_url} controls preload="metadata" className="h-full w-full object-contain" />
              ) : (
                <Image
                  src={item.media.file_url}
                  alt={item.media.alt_text}
                  fill
                  // Spec/lab scans must never be cropped in the preview either.
                  className={item.section === "spec_lab" ? "object-contain p-2" : "object-cover"}
                />
              )}
            </div>

            <div className="mt-2">
              <Label className="text-small">Penempatan</Label>
              <select
                defaultValue={item.section ?? "gallery"}
                onChange={(e) => void handleUpdate(item.id, { section: e.target.value })}
                className="w-full rounded-field border border-neutral-300 px-3 py-2 text-small"
              >
                {PRODUCT_MEDIA_SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {PRODUCT_MEDIA_SECTION_LABELS[section]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2">
              <Label className="text-small">Caption (opsional)</Label>
              <Input
                defaultValue={item.caption ?? ""}
                placeholder="mis. Report of Analysis"
                onBlur={(e) => void handleUpdate(item.id, { caption: e.target.value })}
              />
            </div>

            <button
              type="button"
              onClick={() => setDeleteTargetId(item.id)}
              className="mt-2 text-small text-red-600 underline"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <MediaUploadField
          label="Tambah Media Produk"
          media={null}
          hint="Foto galeri: 1200×1200px (1:1). Lembar spesifikasi / hasil lab: unggah gambar dokumen penuh — video juga didukung. Maksimum 5MB."
          onChange={async (media) => {
            await adminApi.post(`/admin/products/${productId}/gallery`, { media_id: media.id });
            onChange();
          }}
        />
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus foto galeri ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          onConfirm={() => void handleDelete(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

function ProductSpecificationsSection({
  productId,
  specifications,
  onChange,
}: {
  productId: string;
  specifications: ProductDetail["specifications"];
  onChange: () => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [group, setGroup] = useState<"specification" | "export_info" | "detail_info">("specification");
  const [variantLabel, setVariantLabel] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleAdd() {
    if (!key.trim() || !value.trim()) return;
    await adminApi.post(`/admin/products/${productId}/specifications`, {
      spec_key: key,
      spec_value: value,
      group,
      variant_label: variantLabel.trim() || undefined,
    });
    setKey("");
    setValue("");
    onChange();
  }

  async function handleDelete(specId: string) {
    try {
      await adminApi.delete(`/admin/products/${productId}/specifications/${specId}`);
      onChange();
      showToast("Spesifikasi berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus spesifikasi. Silakan coba lagi.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  }

  // Each group gets its own table, so an Admin can see exactly where a row will appear.
  const specRows = specifications.filter((spec) => spec.group === "specification");
  const exportRows = specifications.filter((spec) => spec.group === "export_info");
  const detailRows = specifications.filter((spec) => spec.group === "detail_info");

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Spesifikasi & Info Ekspor</h2>
      <p className="mt-1 text-small text-neutral-600">
        &ldquo;Spesifikasi&rdquo; tampil di kartu spesifikasi produk (Bagian 5); &ldquo;Info
        Ekspor&rdquo; tampil di kartu info ekspor terpisah (Bagian 9 — MOQ, Incoterms, dsb.) di
        halaman produk publik. Untuk produk dengan beberapa grade (mis. Copra: Edible / Regular /
        Mixed), isi &ldquo;Grade/Varian&rdquo; supaya baris-barisnya dikelompokkan otomatis.
      </p>

      <h3 className="mt-5 text-body font-medium text-neutral-900">Spesifikasi</h3>
      <SpecTable rows={specRows} onDelete={setDeleteTargetId} />

      {exportRows.length > 0 && (
        <>
          <h3 className="mt-6 text-body-lg font-medium text-neutral-900">Info Ekspor</h3>
          <SpecTable rows={exportRows} onDelete={setDeleteTargetId} />
        </>
      )}

      {detailRows.length > 0 && (
        <>
          <h3 className="mt-6 text-body-lg font-medium text-neutral-900">Detail Information</h3>
          <p className="text-small text-neutral-600">
            Tampil sebagai tabel di halaman produk — mis. MOQ, Packaging, Payment Terms, Shipment Terms,
            Production Capacity.
          </p>
          <SpecTable rows={detailRows} onDelete={setDeleteTargetId} />
        </>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="spec-group" className="text-small">
            Grup
          </Label>
          <select
            id="spec-group"
            value={group}
            onChange={(e) => setGroup(e.target.value as "specification" | "export_info")}
            className="rounded-field border border-neutral-300 px-3 py-2 text-body"
          >
            <option value="specification">Spesifikasi</option>
            <option value="export_info">Info Ekspor</option>
            <option value="detail_info">Detail Information (tabel)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="spec-variant" className="text-small">
            Grade/Varian (opsional)
          </Label>
          <Input
            id="spec-variant"
            value={variantLabel}
            onChange={(e) => setVariantLabel(e.target.value)}
            placeholder="mis. Edible (White Copra)"
          />
        </div>
        <div>
          <Label htmlFor="spec-key" className="text-small">
            Nama
          </Label>
          <Input id="spec-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="mis. Moisture Content / MOQ" />
        </div>
        <div>
          <Label htmlFor="spec-value" className="text-small">
            Nilai
          </Label>
          <Input id="spec-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="mis. ≤ 6% / 1 Container (20ft)" />
        </div>
        <Button type="button" variant="secondary" onClick={() => void handleAdd()}>
          Tambah
        </Button>
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus baris ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          onConfirm={() => void handleDelete(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

function SpecTable({
  rows,
  onDelete,
}: {
  rows: ProductDetail["specifications"];
  onDelete: (specId: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="mt-2 text-small text-neutral-500">Belum ada.</p>;
  }

  // Rows sharing a variant_label (e.g. produk dengan beberapa grade seperti Copra) get their
  // own sub-tabel dengan judul — mencerminkan cara tampilannya di halaman publik.
  const groups = new Map<string | null, ProductDetail["specifications"]>();
  for (const spec of rows) {
    const key = spec.variant_label;
    const list = groups.get(key);
    if (list) list.push(spec);
    else groups.set(key, [spec]);
  }

  return (
    <>
      {Array.from(groups.entries()).map(([variantLabel, group], index) => (
        <div key={variantLabel ?? `__ungrouped_${index}`} className={index > 0 ? "mt-3" : undefined}>
          {variantLabel && (
            <p className="mt-2 text-small font-semibold uppercase tracking-wide text-primary-700">{variantLabel}</p>
          )}
          <table className="mt-2 w-full text-body">
            <tbody>
              {group.map((spec) => (
                <tr key={spec.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4 font-medium text-neutral-900">{spec.spec_key}</td>
                  <td className="py-2 pr-4 text-neutral-600">{spec.spec_value}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => onDelete(spec.id)}
                      className="text-small text-red-600 underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

const MAX_DOWNLOAD_SIZE_BYTES = 20 * 1024 * 1024;

function DownloadPdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <text x="12" y="17" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor">
        PDF
      </text>
    </svg>
  );
}

/**
 * Upload flow: POST /admin/media (multipart) → attach the resulting media's URL to the
 * product via POST /admin/products/:id/downloads. Auto-saves on file select (no separate
 * "Save" button, same pattern as MediaUploadField/DocumentUploadField elsewhere in this
 * page) — each PDF is its own committed record the moment it finishes uploading.
 */
function ProductDownloadsSection({
  productId,
  downloads,
  onChange,
}: {
  productId: string;
  downloads: ProductDetail["downloads"];
  onChange: () => void;
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  async function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (file.size > MAX_DOWNLOAD_SIZE_BYTES) {
      setError(`Ukuran file terlalu besar. Maksimal ${(MAX_DOWNLOAD_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", file.name);
      const media = await adminApi.post<Media>("/admin/media", formData);
      await adminApi.post(`/admin/products/${productId}/downloads`, {
        file_name: file.name,
        file_url: media.file_url,
      });
      onChange();
      showToast("PDF berhasil diunggah.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unggah gagal. Silakan coba lagi.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(downloadId: string) {
    try {
      await adminApi.delete(`/admin/products/${productId}/downloads/${downloadId}`);
      onChange();
      showToast("File unduhan berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus file unduhan. Silakan coba lagi.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  }

  return (
    <Card className="mt-6 mb-10">
      <div className="flex items-center gap-2">
        <DownloadPdfIcon className="text-red-600" />
        <h2 className="text-h3 text-neutral-900">File Unduhan (PDF)</h2>
      </div>
      <p className="mt-1 text-small text-neutral-500">
        Spesifikasi produk atau brosur dalam format PDF yang bisa diunduh pengunjung website.
      </p>

      {downloads.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {downloads.map((download) => (
            <li
              key={download.id}
              className="flex items-center gap-3 rounded-field border border-neutral-200 bg-neutral-50 p-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-white text-red-600">
                <DownloadPdfIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-neutral-900">{download.file_name}</p>
                <p className="text-small text-neutral-500">
                  Diunggah {new Date(download.uploaded_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-small font-medium">
                <a href={download.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
                  Buka
                </a>
                <a href={download.file_url} download className="text-primary-700 underline">
                  Unduh
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(download.id)}
                  className="text-red-600 underline"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-field border border-dashed border-neutral-300 p-4 text-small text-neutral-500">
          Belum ada file PDF yang diunggah untuk produk ini.
        </p>
      )}

      <div className="mt-4">
        <label
          htmlFor="download-file"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-field border border-dashed border-neutral-300 px-4 py-3 text-small font-medium text-neutral-600 transition-colors hover:border-primary-400 hover:text-primary-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-disabled={uploading}
        >
          <DownloadPdfIcon />
          {uploading ? "Mengunggah..." : "Unggah PDF Baru"}
        </label>
        <input
          ref={fileInputRef}
          id="download-file"
          type="file"
          accept="application/pdf"
          onChange={() => void handleFileChange()}
          disabled={uploading}
          className="sr-only"
        />
        <p className="mt-1 text-small text-neutral-500">Format PDF, maksimum 20MB.</p>

        {uploading && (
          <div className="mt-2" role="status">
            <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary-500" />
            </div>
          </div>
        )}
        {error && (
          <p className="mt-2 text-small text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus file unduhan ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          onConfirm={() => void handleDelete(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

const PACKAGING_APPLICATION_TYPE_LABELS: Record<"packaging" | "application", string> = {
  packaging: "Packaging",
  application: "Application",
};

/** "Packaging" / "Application" manager — two flat lists (one per `type`) sharing the same
 * CRUD shape. A photo is optional per entry: the public page falls back to a clean icon when
 * none is uploaded (see PackagingCards.tsx), so an Admin can list packaging types immediately
 * and attach real photos later without blocking on it. */
function ProductPackagingSection({
  productId,
  entries,
  onChange,
}: {
  productId: string;
  entries: ProductDetail["packaging"];
  onChange: () => void;
}) {
  const [newType, setNewType] = useState<"packaging" | "application">("packaging");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  const packagingRows = entries.filter((e) => e.type === "packaging").sort((a, b) => a.order - b.order);
  const applicationRows = entries.filter((e) => e.type === "application").sort((a, b) => a.order - b.order);

  async function handleAdd() {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setAdding(true);
    try {
      await adminApi.post(`/admin/products/${productId}/packaging-applications`, {
        type: newType,
        title: newTitle,
        description: newDescription,
      });
      setNewTitle("");
      setNewDescription("");
      onChange();
    } catch {
      showToast("Gagal menambahkan entri. Silakan coba lagi.", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate(entry: ProductDetail["packaging"][number], patch: Partial<{ title: string; description: string; media_id: string | null; order: number }>) {
    try {
      await adminApi.put(`/admin/products/${productId}/packaging-applications/${entry.id}`, {
        type: entry.type,
        title: patch.title ?? entry.title,
        description: patch.description ?? entry.description,
        media_id: patch.media_id !== undefined ? (patch.media_id ?? undefined) : entry.media?.id,
        order: patch.order ?? entry.order,
      });
      onChange();
    } catch {
      showToast("Gagal menyimpan perubahan. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(rows: ProductDetail["packaging"], from: number, to: number) {
    if (to < 0 || to >= rows.length) return;
    const next = arrayMove(rows, from, to);
    try {
      await Promise.all(
        next.map((entry, index) =>
          entry.order === index
            ? null
            : adminApi.put(`/admin/products/${productId}/packaging-applications/${entry.id}`, {
                type: entry.type,
                title: entry.title,
                description: entry.description,
                media_id: entry.media?.id,
                order: index,
              }),
        ),
      );
      onChange();
    } catch {
      showToast("Gagal memperbarui urutan. Silakan coba lagi.", "error");
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await adminApi.delete(`/admin/products/${productId}/packaging-applications/${entryId}`);
      onChange();
      showToast("Entri berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus entri. Silakan coba lagi.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  }

  function renderRows(rows: ProductDetail["packaging"]) {
    return (
      <div className="mt-3 flex flex-col gap-3">
        {rows.map((entry, index) => (
          <div key={entry.id} className="flex flex-col gap-3 rounded-field border border-neutral-200 p-3 sm:flex-row sm:items-start">
            <div className="w-full shrink-0 sm:w-40">
              <MediaUploadField
                label="Foto (opsional)"
                media={entry.media}
                onChange={(media) => void handleUpdate(entry, { media_id: media.id })}
                onRemove={entry.media ? () => void handleUpdate(entry, { media_id: null }) : undefined}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Label className="text-small">Nama</Label>
              <Input
                defaultValue={entry.title}
                onBlur={(e) => e.target.value.trim() && void handleUpdate(entry, { title: e.target.value })}
              />
              <Label className="mt-2 text-small">Deskripsi (opsional)</Label>
              <Textarea
                rows={2}
                defaultValue={entry.description}
                onBlur={(e) => void handleUpdate(entry, { description: e.target.value })}
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 text-small">
                <button
                  type="button"
                  onClick={() => void handleReorder(rows, index, index - 1)}
                  disabled={index === 0}
                  className="text-neutral-600 underline disabled:opacity-30"
                >
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleReorder(rows, index, index + 1)}
                  disabled={index === rows.length - 1}
                  className="text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(entry.id)} className="ml-auto text-red-600 underline">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Packaging &amp; Application</h2>
      <p className="mt-1 text-small text-neutral-600">
        &ldquo;Packaging&rdquo; tampil di Bagian 7 (mis. Jute Gunny Bags, Polypropylene Bags, Plastic Netted
        Bags) dan &ldquo;Application&rdquo; di Bagian 8 pada halaman produk publik. Foto bersifat opsional —
        tanpa foto, kartu menampilkan ikon standar.
      </p>

      <h3 className="mt-5 text-body font-medium text-neutral-900">Packaging</h3>
      {packagingRows.length > 0 ? renderRows(packagingRows) : <p className="mt-2 text-small text-neutral-500">Belum ada entri.</p>}

      <h3 className="mt-6 text-body font-medium text-neutral-900">Application</h3>
      {applicationRows.length > 0 ? renderRows(applicationRows) : <p className="mt-2 text-small text-neutral-500">Belum ada entri.</p>}

      <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div>
          <Label htmlFor="pa-type" className="text-small">
            Tipe
          </Label>
          <select
            id="pa-type"
            value={newType}
            onChange={(e) => setNewType(e.target.value as "packaging" | "application")}
            className="rounded-field border border-neutral-300 px-3 py-2 text-body"
          >
            {Object.entries(PACKAGING_APPLICATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="pa-title" className="text-small">
            Nama
          </Label>
          <Input id="pa-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="mis. Jute Gunny Bags" />
        </div>
        <div className="min-w-[16rem] flex-1">
          <Label htmlFor="pa-description" className="text-small">
            Deskripsi
          </Label>
          <Input
            id="pa-description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="mis. Suitable for export handling / bulk shipment"
          />
        </div>
        <Button type="button" variant="secondary" disabled={adding} onClick={() => void handleAdd()}>
          {adding ? "Menambahkan..." : "Tambah"}
        </Button>
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus entri ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          onConfirm={() => void handleDelete(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

/** "Shape & Size" manager — one row per shape: reference photo, shape name, and the sizes
 * available in it (one per line, stored verbatim). */
function ProductShapesSection({
  productId,
  shapes,
  onChange,
}: {
  productId: string;
  shapes: ProductDetail["shapes"];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleAdd() {
    if (!name.trim()) return;
    try {
      await adminApi.post(`/admin/products/${productId}/shapes`, { name, order: shapes.length });
      setName("");
      onChange();
      showToast("Shape berhasil ditambahkan.");
    } catch {
      showToast("Gagal menambah shape. Silakan coba lagi.", "error");
    }
  }

  async function handleUpdate(shapeId: string, patch: Record<string, unknown>) {
    try {
      const shape = shapes.find((item) => item.id === shapeId);
      // `name` is required by the API, so always resend it alongside the changed field.
      await adminApi.put(`/admin/products/${productId}/shapes/${shapeId}`, {
        name: shape?.name,
        ...patch,
      });
      onChange();
    } catch {
      showToast("Gagal menyimpan perubahan shape.", "error");
    }
  }

  async function handleDelete(shapeId: string) {
    try {
      await adminApi.delete(`/admin/products/${productId}/shapes/${shapeId}`);
      onChange();
      showToast("Shape berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus shape. Silakan coba lagi.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Shape &amp; Size</h2>
      <p className="mt-1 text-small text-neutral-600">
        Bentuk produk beserta ukurannya — mis. FLAT, CUBE, HEXA, STICK. Tulis satu ukuran per baris,
        persis seperti yang ingin ditampilkan (mis. <code>25x25x17 - (108 pcs/kg)</code>).
      </p>

      {shapes.length === 0 && (
        <div className="mt-4 rounded-field border border-dashed border-neutral-300 p-6 text-center">
          <p className="text-body text-neutral-600">Belum ada shape untuk produk ini.</p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {shapes.map((shape) => (
          <div key={shape.id} className="rounded-field border border-neutral-200 p-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-[12rem] flex-1">
                <Label className="text-small">Nama Shape</Label>
                <Input
                  defaultValue={shape.name}
                  onBlur={(e) => void handleUpdate(shape.id, { name: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetId(shape.id)}
                className="mt-6 text-small text-red-600 underline"
              >
                Hapus
              </button>
            </div>

            <div className="mt-3">
              <Label className="text-small">Ukuran (satu per baris)</Label>
              <Textarea
                rows={4}
                defaultValue={shape.sizes}
                placeholder={"25x25x17 - (108 pcs/kg)\n25x25x15 - (120 pcs/kg)"}
                onBlur={(e) => void handleUpdate(shape.id, { sizes: e.target.value })}
              />
            </div>

            <div className="mt-3">
              <MediaUploadField
                label="Foto Shape"
                media={shape.media}
                hint="Foto kecil bentuk produk. Rekomendasi latar polos, 600×600px."
                onChange={(media) => void handleUpdate(shape.id, { media_id: media.id })}
                onRemove={() => void handleUpdate(shape.id, { media_id: null })}
                previewFit="contain"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div className="min-w-[14rem] flex-1">
          <Label htmlFor="new-shape-name">+ Tambah Shape</Label>
          <Input
            id="new-shape-name"
            value={name}
            placeholder="mis. CUBE"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="button" onClick={() => void handleAdd()}>
          Tambah
        </Button>
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus shape ini?"
          message="Shape dan daftar ukurannya akan dihapus dari halaman produk."
          onConfirm={() => void handleDelete(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}
