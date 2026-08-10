"use client";

import { Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import { LOCALE_LABELS, PRODUCT_CATEGORIES } from "@ppn/shared-types";
import type { ProductDetail, Translations } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";

const TRANSLATABLE_FIELDS = [
  { key: "name", label: "Nama Produk", multiline: false },
  { key: "category", label: "Kategori", multiline: false },
  { key: "shortDescription", label: "Ringkasan Singkat", multiline: true },
  { key: "fullDescription", label: "Deskripsi Lengkap", multiline: true },
] as const;

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [translations, setTranslations] = useState<Translations>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { status, error, run } = useSaveState();
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
    const result = await run(() =>
      adminApi.put(`/admin/products/${id}`, {
        slug: formData.get("slug"),
        name: formData.get("name"),
        category: formData.get("category"),
        short_description: formData.get("short_description"),
        full_description: formData.get("full_description"),
        status: formData.get("status"),
        is_featured: formData.get("is_featured") === "on",
        translations,
      }),
    );
    if (result.success) await load();
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Ubah Produk: {product.name}</h1>
        <button type="button" onClick={() => setConfirmingDelete(true)} className="text-body text-red-600 underline">
          Hapus Produk
        </button>
      </div>

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

          <div className="flex items-center gap-6">
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
            <div>
              <Label htmlFor="status" className="mb-0">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={product.status}
                className="ml-2 rounded-field border border-neutral-300 px-3 py-1.5 text-body"
              >
                <option value="draft">Draf</option>
                <option value="published">Diterbitkan</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4">
            <Button type="submit" disabled={status === "saving"} className="w-fit">
              {status === "saving" ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <SaveStateIndicator status={status} error={error} />
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
      <ProductSpecificationsSection productId={id} specifications={product.specifications} onChange={load} />
      <ProductDownloadsSection productId={id} downloads={product.downloads} onChange={load} />

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

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Galeri Produk</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {gallery.map((item) => (
          <div key={item.id}>
            <div className="relative aspect-square w-full overflow-hidden rounded-field">
              <Image src={item.media.file_url} alt={item.media.alt_text} fill className="object-cover" />
            </div>
            <button type="button" onClick={() => setDeleteTargetId(item.id)} className="mt-1 text-small text-red-600 underline">
              Hapus
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <MediaUploadField
          label="Tambah Foto Galeri"
          media={null}
          hint="Rekomendasi: 1200×1200px (rasio 1:1). Maksimum 5MB."
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
  const [group, setGroup] = useState<"specification" | "export_info">("specification");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleAdd() {
    if (!key.trim() || !value.trim()) return;
    await adminApi.post(`/admin/products/${productId}/specifications`, {
      spec_key: key,
      spec_value: value,
      group,
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

  const specRows = specifications.filter((spec) => spec.group !== "export_info");
  const exportInfoRows = specifications.filter((spec) => spec.group === "export_info");

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Spesifikasi & Info Ekspor</h2>
      <p className="mt-1 text-small text-neutral-600">
        &ldquo;Spesifikasi&rdquo; tampil di kartu spesifikasi produk (Bagian 5); &ldquo;Info
        Ekspor&rdquo; tampil di kartu info ekspor terpisah (Bagian 9 — MOQ, Incoterms, dsb.) di
        halaman produk publik.
      </p>

      <h3 className="mt-5 text-body font-medium text-neutral-900">Spesifikasi</h3>
      <SpecTable rows={specRows} onDelete={setDeleteTargetId} />

      <h3 className="mt-6 text-body font-medium text-neutral-900">Info Ekspor</h3>
      <SpecTable rows={exportInfoRows} onDelete={setDeleteTargetId} />

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
          </select>
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
  return (
    <table className="mt-2 w-full text-body">
      <tbody>
        {rows.map((spec) => (
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
  );
}

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
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await run(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", file.name);
      const media = await adminApi.post<{ file_url: string }>("/admin/media", formData);
      await adminApi.post(`/admin/products/${productId}/downloads`, {
        file_name: file.name,
        file_url: media.file_url,
      });
    });
    event.target.value = "";
    if (result.success) onChange();
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
      <h2 className="text-h3 text-neutral-900">File Unduhan (PDF)</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {downloads.map((download) => (
          <li key={download.id} className="flex items-center justify-between text-body">
            <a href={download.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
              {download.file_name}
            </a>
            <button type="button" onClick={() => setDeleteTargetId(download.id)} className="text-small text-red-600 underline">
              Hapus
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Label htmlFor="download-file" className="text-small">
          Unggah PDF Baru
        </Label>
        <input
          id="download-file"
          type="file"
          accept="application/pdf"
          onChange={(e) => void handleFileChange(e)}
          disabled={status === "saving"}
          className="text-small"
        />
        <div className="mt-1">
          <SaveStateIndicator status={status} error={error} />
        </div>
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
