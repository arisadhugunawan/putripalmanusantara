"use client";

import { Badge, Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type {
  DecorativeGraphic,
  DecorativeGraphicPlacement,
  DecorativeGraphicVariant,
  Faq,
  HeroSlide,
  HomepageAboutPreview,
  HomepageHighlight,
  HomepageHighlightIcon,
  HomepagePartnersSection,
  HomepageStatistic,
  HomepageVideoSource,
  PartnerLogo,
  ProductDetail,
} from "@ppn/shared-types";
import { PARTNER_LOGO_SUGGESTED_CATEGORIES } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

// FR-CMS-06 — statistik, FAQ, produk unggulan. Hero Slides/Partner Logos+Partners
// Section/About Preview+Highlights/Decorative Graphics (Post-Launch) live here too since
// they're all Homepage content, matching this page's existing pattern rather than growing
// the admin sidebar with new top-level routes.
export default function AdminHomepagePage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-h2 text-neutral-900">Homepage</h1>
      <HeroSlideEditor />
      <PartnersSectionEditor />
      <PartnerLogoEditor />
      <AboutPreviewEditor />
      <HighlightEditor />
      <StatisticsEditor />
      <FaqEditor />
      <FeaturedProductsEditor />
      <DecorativeGraphicEditor />
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
    <Card className="mt-6">
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

function HeroSlideEditor() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HeroSlide[]>("/admin/homepage/hero-slides");
    setSlides(data);
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
      await adminApi.post("/admin/homepage/hero-slides", {
        heading: formData.get("heading"),
        subheading: formData.get("subheading"),
        order: slides?.length ?? 0,
        enabled: true,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah slide.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/hero-slides/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus hero slide ini?")) return;
    await adminApi.delete(`/admin/homepage/hero-slides/${id}`);
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Hero Slider</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ditampilkan sebagai slider penuh layar di beranda. Satu slide tampil statis tanpa
        kontrol slider; dua atau lebih baru mengaktifkan autoplay, panah, dan indikator.
      </p>

      <div className="mt-4 flex flex-col gap-6">
        {slides?.map((slide) => (
          <div key={slide.id} className="rounded-field border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <Badge variant={slide.enabled ? "primary" : "neutral"}>
                {slide.enabled ? "Aktif" : "Nonaktif"}
              </Badge>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input
                    type="checkbox"
                    checked={slide.enabled}
                    onChange={(e) => void handleUpdate(slide.id, { enabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Aktifkan
                </label>
                <button type="button" onClick={() => void handleDelete(slide.id)} className="text-small text-red-600 underline">
                  Hapus
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MediaUploadField
                label="Gambar Desktop"
                media={slide.desktop_image}
                onChange={(media) => void handleUpdate(slide.id, { desktop_image_id: media.id })}
              />
              <MediaUploadField
                label="Gambar Mobile (opsional)"
                media={slide.mobile_image}
                onChange={(media) => void handleUpdate(slide.id, { mobile_image_id: media.id })}
              />
            </div>

            <div className="mt-3">
              <Label htmlFor={`heading-${slide.id}`} className="text-small">
                Heading
              </Label>
              <Input
                id={`heading-${slide.id}`}
                defaultValue={slide.heading}
                onBlur={(e) => void handleUpdate(slide.id, { heading: e.target.value })}
              />
            </div>
            <div className="mt-3">
              <Label htmlFor={`subheading-${slide.id}`} className="text-small">
                Sub Heading
              </Label>
              <Textarea
                id={`subheading-${slide.id}`}
                defaultValue={slide.subheading}
                rows={2}
                onBlur={(e) => void handleUpdate(slide.id, { subheading: e.target.value })}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-small">Tombol 1 — Teks</Label>
                <Input
                  defaultValue={slide.button_1_text ?? ""}
                  placeholder="Request Quotation"
                  onBlur={(e) => void handleUpdate(slide.id, { button_1_text: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Tombol 1 — Tautan</Label>
                <Input
                  defaultValue={slide.button_1_link ?? ""}
                  placeholder="#request-quotation"
                  onBlur={(e) => void handleUpdate(slide.id, { button_1_link: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Tombol 2 — Teks</Label>
                <Input
                  defaultValue={slide.button_2_text ?? ""}
                  placeholder="View Products"
                  onBlur={(e) => void handleUpdate(slide.id, { button_2_text: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Tombol 2 — Tautan</Label>
                <Input
                  defaultValue={slide.button_2_link ?? ""}
                  placeholder="/products"
                  onBlur={(e) => void handleUpdate(slide.id, { button_2_link: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-small">Urutan</Label>
                <Input
                  type="number"
                  defaultValue={slide.order}
                  onBlur={(e) => void handleUpdate(slide.id, { order: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-small">Tanggal Terbit (opsional)</Label>
                <Input
                  type="date"
                  defaultValue={slide.publish_date?.slice(0, 10) ?? ""}
                  onBlur={(e) => void handleUpdate(slide.id, { publish_date: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Tambah Slide Baru</p>
        <div>
          <Label htmlFor="new-slide-heading">Heading</Label>
          <Input id="new-slide-heading" name="heading" required />
        </div>
        <div>
          <Label htmlFor="new-slide-subheading">Sub Heading</Label>
          <Textarea id="new-slide-subheading" name="subheading" rows={2} required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Slide
        </Button>
      </form>
    </Card>
  );
}

const MARQUEE_SPEED_PRESETS = [
  { label: "Slow", seconds: 60 },
  { label: "Normal", seconds: 40 },
  { label: "Fast", seconds: 25 },
];

function PartnersSectionEditor() {
  const [section, setSection] = useState<HomepagePartnersSection | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepagePartnersSection>("/admin/homepage/partners-section");
    setSection(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/homepage/partners-section", patch);
    setSavedMessage("Tersimpan.");
    await load();
    setTimeout(() => setSavedMessage(null), 2000);
  }

  if (!section) return null;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 text-neutral-900">Judul & Kecepatan Marquee Mitra</h2>
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => void handleUpdate({ enabled: e.target.checked })}
            className="h-4 w-4"
          />
          Tampilkan section ini
        </label>
      </div>

      <div className="mt-4">
        <Label htmlFor="ps-title">Label Kecil</Label>
        <Input id="ps-title" defaultValue={section.title} onBlur={(e) => void handleUpdate({ title: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ps-subtitle">Kalimat Pendukung</Label>
        <Textarea
          id="ps-subtitle"
          rows={2}
          defaultValue={section.subtitle}
          onBlur={(e) => void handleUpdate({ subtitle: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <Label className="text-small">Kecepatan Marquee</Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {MARQUEE_SPEED_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => void handleUpdate({ marquee_duration_seconds: preset.seconds })}
              className={`rounded-field border px-3 py-1.5 text-small ${
                section.marquee_duration_seconds === preset.seconds
                  ? "border-primary-600 bg-primary-50 font-medium text-primary-700"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {preset.label} ({preset.seconds}s)
            </button>
          ))}
          <label className="flex items-center gap-2 text-small text-neutral-600">
            Custom (detik):
            <input
              type="number"
              min={15}
              max={90}
              defaultValue={section.marquee_duration_seconds}
              onBlur={(e) => void handleUpdate({ marquee_duration_seconds: Number(e.target.value) })}
              className="w-20 rounded-field border border-neutral-300 px-2 py-1"
            />
          </label>
        </div>
        <p className="mt-1 text-small text-neutral-500">Direkomendasikan 35–45 detik per siklus penuh.</p>
      </div>

      {savedMessage && <p className="mt-3 text-small text-primary-700">{savedMessage}</p>}
    </Card>
  );
}

function PartnerLogoEditor() {
  const [logos, setLogos] = useState<PartnerLogo[] | null>(null);
  const [newLogoMediaId, setNewLogoMediaId] = useState<string | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<{ file_url: string; alt_text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<PartnerLogo[]>("/admin/homepage/partner-logos");
    setLogos(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newLogoMediaId) {
      setError("Unggah logo terlebih dahulu (gunakan aset resmi dari sumber institusi, bukan logo tidak resmi).");
      return;
    }
    const formData = new FormData(event.currentTarget);
    try {
      await adminApi.post("/admin/homepage/partner-logos", {
        logo_id: newLogoMediaId,
        partner_name: formData.get("partner_name"),
        description: formData.get("description") || undefined,
        category: formData.get("category") || undefined,
        website_url: formData.get("website_url") || undefined,
        alt_text: formData.get("alt_text") || undefined,
        open_in_new_tab: true,
        order: logos?.length ?? 0,
        enabled: true,
        featured: true,
      });
      event.currentTarget.reset();
      setNewLogoMediaId(null);
      setNewLogoPreview(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah logo mitra.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/partner-logos/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus logo mitra ini?")) return;
    await adminApi.delete(`/admin/homepage/partner-logos/${id}`);
    await load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!logos) return;
    const target = index + direction;
    if (target < 0 || target >= logos.length) return;
    const a = logos[index];
    const b = logos[target];
    await Promise.all([
      adminApi.put(`/admin/homepage/partner-logos/${a.id}`, { order: b.order }),
      adminApi.put(`/admin/homepage/partner-logos/${b.id}`, { order: a.order }),
    ]);
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Logo Mitra & Institusi</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ditampilkan sebagai marquee berjalan di beranda. Kosong secara default — hanya
        gunakan aset logo resmi dari sumber institusi terkait; jika logo resmi belum
        tersedia, jangan unggah versi tidak resmi. &ldquo;Aktif&rdquo; menyimpan data di
        Admin; &ldquo;Featured&rdquo; adalah saklar terpisah yang benar-benar menampilkannya
        di marquee beranda.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {logos?.map((logo, index) => (
          <div key={logo.id} className="rounded-field border border-neutral-200 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-12 w-24 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-white">
                <Image src={logo.logo.file_url} alt={logo.logo.alt_text} fill className="object-contain p-1" />
              </div>
              <Input
                className="max-w-[180px]"
                defaultValue={logo.partner_name}
                onBlur={(e) => void handleUpdate(logo.id, { partner_name: e.target.value })}
              />
              <Input
                className="max-w-[160px]"
                list="partner-categories"
                defaultValue={logo.category}
                onBlur={(e) => void handleUpdate(logo.id, { category: e.target.value })}
              />
              <Input
                className="max-w-[200px]"
                placeholder="https://..."
                defaultValue={logo.website_url ?? ""}
                onBlur={(e) => void handleUpdate(logo.id, { website_url: e.target.value })}
              />
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => void handleMove(index, -1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleMove(index, 1)}
                  disabled={index === (logos?.length ?? 0) - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => void handleDelete(logo.id)} className="text-small text-red-600 underline">
                  Hapus
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`logo-desc-${logo.id}`} className="text-small">
                  Deskripsi Singkat
                </Label>
                <Input
                  id={`logo-desc-${logo.id}`}
                  defaultValue={logo.description ?? ""}
                  onBlur={(e) => void handleUpdate(logo.id, { description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`logo-alt-${logo.id}`} className="text-small">
                  Alt Text (kosongkan untuk memakai Nama Mitra)
                </Label>
                <Input
                  id={`logo-alt-${logo.id}`}
                  defaultValue={logo.alt_text ?? ""}
                  onBlur={(e) => void handleUpdate(logo.id, { alt_text: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-small text-neutral-600">
                <input
                  type="checkbox"
                  checked={logo.enabled}
                  onChange={(e) => void handleUpdate(logo.id, { enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-small text-neutral-600">
                <input
                  type="checkbox"
                  checked={logo.featured}
                  onChange={(e) => void handleUpdate(logo.id, { featured: e.target.checked })}
                  className="h-4 w-4"
                />
                Featured (tampil di marquee)
              </label>
              <label className="flex items-center gap-2 text-small text-neutral-600">
                <input
                  type="checkbox"
                  checked={logo.open_in_new_tab}
                  onChange={(e) => void handleUpdate(logo.id, { open_in_new_tab: e.target.checked })}
                  className="h-4 w-4"
                />
                Buka tautan di tab baru
              </label>
            </div>

            <div className="mt-3 rounded-field bg-neutral-50 p-3">
              <p className="text-small font-medium uppercase tracking-wide text-neutral-500">Preview</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative h-10 w-20 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-white">
                  <Image src={logo.logo.file_url} alt="" fill className="object-contain p-1" />
                </div>
                <div className="text-small text-neutral-700">
                  <p className="font-medium text-neutral-900">{logo.partner_name}</p>
                  <p>
                    {logo.category} · {logo.enabled ? "Active" : "Inactive"} · Order {String(index + 1).padStart(2, "0")} ·{" "}
                    {logo.featured ? "Featured: Yes" : "Featured: No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <datalist id="partner-categories">
        {PARTNER_LOGO_SUGGESTED_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Tambah Logo Mitra</p>
        <MediaUploadField
          label="Logo Resmi (PNG/SVG transparan disarankan)"
          media={
            newLogoPreview
              ? {
                  id: newLogoMediaId!,
                  file_url: newLogoPreview.file_url,
                  file_type: "image",
                  alt_text: newLogoPreview.alt_text,
                  width: null,
                  height: null,
                  uploaded_at: new Date().toISOString(),
                }
              : null
          }
          onChange={(media) => {
            setNewLogoMediaId(media.id);
            setNewLogoPreview({ file_url: media.file_url, alt_text: media.alt_text });
          }}
        />
        <div>
          <Label htmlFor="new-logo-name">Nama Mitra/Institusi</Label>
          <Input id="new-logo-name" name="partner_name" required />
        </div>
        <div>
          <Label htmlFor="new-logo-description">Deskripsi Singkat (opsional)</Label>
          <Input id="new-logo-description" name="description" />
        </div>
        <div>
          <Label htmlFor="new-logo-category">Kategori</Label>
          <Input id="new-logo-category" name="category" list="partner-categories" placeholder="Government Institution" />
        </div>
        <div>
          <Label htmlFor="new-logo-url">URL Website (opsional)</Label>
          <Input id="new-logo-url" name="website_url" placeholder="https://..." />
        </div>
        <div>
          <Label htmlFor="new-logo-alt">Alt Text (opsional — kosongkan untuk memakai Nama Mitra)</Label>
          <Input id="new-logo-alt" name="alt_text" placeholder="Kementerian Perdagangan Republik Indonesia" />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Logo
        </Button>
      </form>
    </Card>
  );
}

const DECORATIVE_VARIANTS: { value: DecorativeGraphicVariant; label: string }[] = [
  { value: "leaf_outline", label: "Leaf Outline" },
  { value: "coconut_cross_section", label: "Coconut Cross-Section" },
  { value: "ship_outline", label: "Ship Outline" },
  { value: "compass", label: "Compass" },
  { value: "world_map_outline", label: "World Map Outline" },
  { value: "palm_leaf", label: "Palm Leaf" },
  { value: "coconut_tree_silhouette", label: "Coconut Tree Silhouette" },
];

const DECORATIVE_PLACEMENTS: { value: DecorativeGraphicPlacement; label: string }[] = [
  { value: "hero_behind_content", label: "Di Belakang Konten Hero" },
  { value: "center_background", label: "Tengah Latar Belakang" },
  { value: "top_left", label: "Kiri Atas" },
  { value: "top_right", label: "Kanan Atas" },
  { value: "bottom_left", label: "Kiri Bawah" },
  { value: "bottom_right", label: "Kanan Bawah" },
];

function DecorativeGraphicEditor() {
  const [graphics, setGraphics] = useState<DecorativeGraphic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<DecorativeGraphic[]>("/admin/homepage/decorative-graphics");
    setGraphics(data);
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
      await adminApi.post("/admin/homepage/decorative-graphics", {
        variant: formData.get("variant"),
        placement: formData.get("placement"),
        opacity: Number(formData.get("opacity")),
        scale: Number(formData.get("scale")),
        order: graphics?.length ?? 0,
        enabled: true,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah elemen dekoratif.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/decorative-graphics/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus elemen dekoratif ini?")) return;
    await adminApi.delete(`/admin/homepage/decorative-graphics/${id}`);
    await load();
  }

  return (
    <Card className="mt-6 mb-10">
      <h2 className="text-h3 text-neutral-900">Elemen Dekoratif (Watermark)</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ilustrasi garis (line-art) transparan beropasitas rendah untuk aksen visual di
        beranda. Saat ini hanya dirender di halaman beranda (page = &ldquo;home&rdquo;).
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {graphics?.map((graphic) => (
          <div key={graphic.id} className="flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3">
            <select
              defaultValue={graphic.variant}
              onChange={(e) => void handleUpdate(graphic.id, { variant: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {DECORATIVE_VARIANTS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              defaultValue={graphic.placement}
              onChange={(e) => void handleUpdate(graphic.id, { placement: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {DECORATIVE_PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-small text-neutral-600">
              Opasitas
              <input
                type="number"
                min={0}
                max={0.1}
                step={0.01}
                defaultValue={graphic.opacity}
                onBlur={(e) => void handleUpdate(graphic.id, { opacity: Number(e.target.value) })}
                className="w-16 rounded-field border border-neutral-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-1 text-small text-neutral-600">
              Skala
              <input
                type="number"
                min={0.5}
                max={2}
                step={0.1}
                defaultValue={graphic.scale}
                onBlur={(e) => void handleUpdate(graphic.id, { scale: Number(e.target.value) })}
                className="w-16 rounded-field border border-neutral-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-small text-neutral-600">
              <input
                type="checkbox"
                checked={graphic.enabled}
                onChange={(e) => void handleUpdate(graphic.id, { enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Aktif
            </label>
            <button type="button" onClick={() => void handleDelete(graphic.id)} className="ml-auto text-small text-red-600 underline">
              Hapus
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div>
          <Label htmlFor="new-decor-variant" className="text-small">
            Ilustrasi
          </Label>
          <select id="new-decor-variant" name="variant" className="rounded-field border border-neutral-300 px-3 py-2.5 text-body">
            {DECORATIVE_VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-decor-placement" className="text-small">
            Posisi
          </Label>
          <select id="new-decor-placement" name="placement" className="rounded-field border border-neutral-300 px-3 py-2.5 text-body">
            {DECORATIVE_PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-decor-opacity" className="text-small">
            Opasitas
          </Label>
          <Input id="new-decor-opacity" name="opacity" type="number" min={0} max={0.1} step={0.01} defaultValue={0.06} className="w-20" />
        </div>
        <div>
          <Label htmlFor="new-decor-scale" className="text-small">
            Skala
          </Label>
          <Input id="new-decor-scale" name="scale" type="number" min={0.5} max={2} step={0.1} defaultValue={1} className="w-20" />
        </div>
        <Button type="submit">Tambah</Button>
      </form>
      {error && <p className="mt-2 text-small text-red-600">{error}</p>}
    </Card>
  );
}

const VIDEO_SOURCES: { value: HomepageVideoSource; label: string }[] = [
  { value: "none", label: "Belum ada video" },
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "upload", label: "Unggah File" },
];

function AboutPreviewEditor() {
  const [preview, setPreview] = useState<HomepageAboutPreview | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageAboutPreview>("/admin/homepage/about-preview");
    setPreview(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleUpdate(patch: Record<string, unknown>) {
    await adminApi.put("/admin/homepage/about-preview", patch);
    setSavedMessage("Tersimpan.");
    await load();
    setTimeout(() => setSavedMessage(null), 2000);
  }

  if (!preview) return null;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 text-neutral-900">About Company Preview</h2>
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input
            type="checkbox"
            checked={preview.enabled}
            onChange={(e) => void handleUpdate({ enabled: e.target.checked })}
            className="h-4 w-4"
          />
          Tampilkan section ini
        </label>
      </div>
      <p className="mt-1 text-small text-neutral-600">
        Section perkenalan perusahaan yang tampil di beranda setelah Hero Slider dan Partner
        Logo. Tautan &ldquo;{preview.cta_text}&rdquo; mengarah ke halaman About Company lengkap.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ap-label">Label Kecil</Label>
          <Input id="ap-label" defaultValue={preview.label} onBlur={(e) => void handleUpdate({ label: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="ap-heading">Heading Utama</Label>
          <Input id="ap-heading" defaultValue={preview.heading} onBlur={(e) => void handleUpdate({ heading: e.target.value })} />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="ap-p1">Paragraf 1</Label>
        <Textarea id="ap-p1" rows={2} defaultValue={preview.paragraph_1} onBlur={(e) => void handleUpdate({ paragraph_1: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ap-p2">Paragraf 2</Label>
        <Textarea id="ap-p2" rows={2} defaultValue={preview.paragraph_2} onBlur={(e) => void handleUpdate({ paragraph_2: e.target.value })} />
      </div>
      <div className="mt-4">
        <Label htmlFor="ap-p3">Paragraf 3</Label>
        <Textarea id="ap-p3" rows={2} defaultValue={preview.paragraph_3} onBlur={(e) => void handleUpdate({ paragraph_3: e.target.value })} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ap-cta-text">Teks Tombol CTA</Label>
          <Input id="ap-cta-text" defaultValue={preview.cta_text} onBlur={(e) => void handleUpdate({ cta_text: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="ap-cta-link">Tautan CTA</Label>
          <Input id="ap-cta-link" defaultValue={preview.cta_link} onBlur={(e) => void handleUpdate({ cta_link: e.target.value })} />
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Video Perusahaan</p>
        <div className="mt-3">
          <Label htmlFor="ap-video-source" className="text-small">
            Sumber Video
          </Label>
          <select
            id="ap-video-source"
            defaultValue={preview.video_source}
            onChange={(e) => void handleUpdate({ video_source: e.target.value })}
            className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body sm:w-64"
          >
            {VIDEO_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        {(preview.video_source === "youtube" || preview.video_source === "vimeo") && (
          <div className="mt-3">
            <Label htmlFor="ap-video-url" className="text-small">
              URL {preview.video_source === "youtube" ? "YouTube" : "Vimeo"}
            </Label>
            <Input
              id="ap-video-url"
              defaultValue={preview.video_url ?? ""}
              placeholder="https://..."
              onBlur={(e) => void handleUpdate({ video_url: e.target.value })}
            />
          </div>
        )}

        {preview.video_source === "upload" && (
          <div className="mt-3">
            <MediaUploadField
              label="File Video"
              media={preview.video_media}
              onChange={(media) => void handleUpdate({ video_media_id: media.id })}
            />
          </div>
        )}

        {preview.video_source !== "none" && (
          <div className="mt-3">
            <MediaUploadField
              label="Thumbnail Kustom (opsional)"
              media={preview.video_thumbnail}
              onChange={(media) => void handleUpdate({ video_thumbnail_id: media.id })}
            />
          </div>
        )}
      </div>

      {savedMessage && <p className="mt-3 text-small text-primary-700">{savedMessage}</p>}
    </Card>
  );
}

const HIGHLIGHT_ICONS: { value: HomepageHighlightIcon; label: string }[] = [
  { value: "quality", label: "Quality (centang)" },
  { value: "sustainability", label: "Sustainability (daun)" },
  { value: "partnership", label: "Partnership (dua orang)" },
  { value: "service", label: "Service (dokumen)" },
  { value: "globe", label: "Globe" },
  { value: "award", label: "Award (medali)" },
];

function HighlightEditor() {
  const [highlights, setHighlights] = useState<HomepageHighlight[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<HomepageHighlight[]>("/admin/homepage/highlights");
    setHighlights(data);
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
      await adminApi.post("/admin/homepage/highlights", {
        icon: formData.get("icon"),
        title: formData.get("title"),
        description: formData.get("description"),
        order: highlights?.length ?? 0,
        enabled: true,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah highlight.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    await adminApi.put(`/admin/homepage/highlights/${id}`, patch);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus highlight card ini?")) return;
    await adminApi.delete(`/admin/homepage/highlights/${id}`);
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Highlight Cards (About Preview)</h2>
      <p className="mt-1 text-small text-neutral-600">4 kartu keunggulan di bawah teks perkenalan pada section About Company Preview.</p>

      <div className="mt-4 flex flex-col gap-3">
        {highlights?.map((highlight) => (
          <div key={highlight.id} className="flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3">
            <select
              defaultValue={highlight.icon}
              onChange={(e) => void handleUpdate(highlight.id, { icon: e.target.value })}
              className="rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {HIGHLIGHT_ICONS.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
            <Input
              className="max-w-[200px]"
              defaultValue={highlight.title}
              onBlur={(e) => void handleUpdate(highlight.id, { title: e.target.value })}
            />
            <Input
              className="max-w-[280px]"
              defaultValue={highlight.description}
              onBlur={(e) => void handleUpdate(highlight.id, { description: e.target.value })}
            />
            <label className="flex items-center gap-2 text-small text-neutral-600">
              <input
                type="checkbox"
                checked={highlight.enabled}
                onChange={(e) => void handleUpdate(highlight.id, { enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Aktif
            </label>
            <button type="button" onClick={() => void handleDelete(highlight.id)} className="ml-auto text-small text-red-600 underline">
              Hapus
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">Tambah Highlight</p>
        <div>
          <Label htmlFor="new-highlight-icon">Ikon</Label>
          <select id="new-highlight-icon" name="icon" className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body">
            {HIGHLIGHT_ICONS.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {icon.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-highlight-title">Judul</Label>
          <Input id="new-highlight-title" name="title" required />
        </div>
        <div>
          <Label htmlFor="new-highlight-desc">Deskripsi Singkat</Label>
          <Input id="new-highlight-desc" name="description" required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah Highlight
        </Button>
      </form>
    </Card>
  );
}
