"use client";

import { Badge, Button, Card, EmptyState, Input, Label, Textarea } from "@ppn/ui-components";
import { getMediaPolicy, SUPPORTED_LOCALES } from "@ppn/shared-types";
import type { HeroButtonStyle, HeroSlide, HeroTextAlignment, Locale } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { HeroSlidePreviewModal } from "@/components/admin/HeroSlidePreviewModal";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { useToast } from "@/components/admin/Toast";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

/** Compact per-locale presence indicator — English is always ✓ (it's the source of truth);
 * the other 5 are ✓ only once at least one field actually has translated text. */
function HeroSlideTranslationStatus({ translations }: { translations: HeroSlide["translations"] }) {
  return (
    <span className="flex flex-wrap gap-1.5 text-[11px] font-medium normal-case tracking-normal text-neutral-500">
      {SUPPORTED_LOCALES.map((locale) => {
        const complete =
          locale === "en" ||
          Object.values(translations?.[locale as Exclude<Locale, "en">] ?? {}).some(
            (v) => v.trim().length > 0,
          );
        return (
          <span key={locale} className={complete ? "text-primary-700" : "text-neutral-400"}>
            {locale.toUpperCase()} {complete ? "✓" : "—"}
          </span>
        );
      })}
    </span>
  );
}

const HERO_BUTTON_STYLES: { value: HeroButtonStyle; label: string }[] = [
  { value: "primary", label: "Primary (hijau solid)" },
  { value: "secondary", label: "Secondary (outline)" },
];

const HERO_TEXT_ALIGNMENTS: { value: HeroTextAlignment; label: string }[] = [
  { value: "left", label: "Kiri" },
  { value: "center", label: "Tengah" },
  { value: "right", label: "Kanan" },
];

const MAX_RECOMMENDED_ACTIVE_SLIDES = 7;
// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const HERO_IMAGE_MAX_BYTES = getMediaPolicy("hero").maxBytes;

export function HeroSlideEditor() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

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
    // Captured before the `await` below — React nulls `event.currentTarget` once the
    // synchronous event-dispatch task finishes, so reading it after an `await` throws even
    // though the request already succeeded.
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    try {
      await adminApi.post("/admin/homepage/hero-slides", {
        heading: formData.get("heading"),
        subheading: formData.get("subheading"),
        order: slides?.length ?? 0,
        enabled: false,
      });
      form.reset();
      await load();
      showToast("Slide berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah slide. Silakan coba lagi.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/homepage/hero-slides/${id}`, patch);
      await load();
    } catch {
      showToast("Gagal menyimpan slide. Silakan coba lagi.", "error");
    }
  }

  async function handleToggleActive(slide: HeroSlide) {
    await handleUpdate(slide.id, { enabled: !slide.enabled });
    showToast(slide.enabled ? "Slide berhasil dinonaktifkan." : "Slide berhasil diaktifkan.");
  }

  async function handleDelete(id: string) {
    try {
      await adminApi.delete(`/admin/homepage/hero-slides/${id}`);
      await load();
      showToast("Slide berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus slide. Silakan coba lagi.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/homepage/hero-slides/${id}/duplicate`);
      await load();
      showToast("Slide berhasil diduplikasi.");
    } catch {
      showToast("Gagal menduplikasi slide. Silakan coba lagi.", "error");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!slides) return;
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const a = slides[index];
    const b = slides[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/homepage/hero-slides/${a.id}`, { order: b.order }),
        adminApi.put(`/admin/homepage/hero-slides/${b.id}`, { order: a.order }),
      ]);
      await load();
      showToast("Urutan slide berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui urutan slide. Silakan coba lagi.", "error");
    }
  }

  const activeCount = slides?.filter((s) => s.enabled).length ?? 0;

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Hero Slider</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ditampilkan sebagai slider penuh layar di beranda. Satu slide aktif tampil statis
        tanpa kontrol slider; dua atau lebih baru mengaktifkan autoplay, panah, dan indikator.
        Hanya slide <strong>Aktif</strong> yang tampil di beranda — slide nonaktif tetap
        tersimpan di sini.
      </p>

      {activeCount > MAX_RECOMMENDED_ACTIVE_SLIDES && (
        <p className="mt-3 rounded-field bg-amber-50 px-3 py-2 text-small text-amber-800">
          Untuk performa terbaik, disarankan maksimal {MAX_RECOMMENDED_ACTIVE_SLIDES} slide
          aktif. Saat ini ada {activeCount} slide aktif.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-6">
        {slides?.length === 0 && <EmptyState title="Belum ada hero slide." />}
        {slides?.map((slide, index) => (
          <HeroSlideCard
            key={slide.id}
            slide={slide}
            index={index}
            slideCount={slides.length}
            onUpdate={(patch) => handleUpdate(slide.id, patch)}
            onToggleActive={() => void handleToggleActive(slide)}
            onDelete={() => setDeleteTargetId(slide.id)}
            onDuplicate={() => void handleDuplicate(slide.id)}
            onMove={(direction) => void handleMove(index, direction)}
            onPreview={() => setPreviewSlide(slide)}
          />
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Tambah Slide Baru</p>
        <p className="text-small text-neutral-600">
          Slide baru dibuat nonaktif — isi detail lengkap di kartu di atas lalu aktifkan
          setelah siap.
        </p>
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

      {previewSlide && <HeroSlidePreviewModal slide={previewSlide} onClose={() => setPreviewSlide(null)} />}
      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus hero slide ini?"
          message="Data yang dihapus tidak dapat dikembalikan."
          onConfirm={() => void handleDelete(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

export function HeroSlideCard({
  slide,
  index,
  slideCount,
  onUpdate,
  onToggleActive,
  onDelete,
  onDuplicate,
  onMove,
  onPreview,
}: {
  slide: HeroSlide;
  index: number;
  slideCount: number;
  onUpdate: (patch: Record<string, unknown>) => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onPreview: () => void;
}) {
  // Local, uncontrolled-but-tracked state so character counters update live on every
  // keystroke while the actual save still only fires on blur (same debounce-by-blur
  // pattern as the rest of this admin panel) — seeded once from the initial slide prop,
  // not reset by the silent `load()` refetch after each save.
  const [headingLength, setHeadingLength] = useState(slide.heading.length);
  const [subheadingLength, setSubheadingLength] = useState(slide.subheading.length);

  const button1Warn = slide.button_1_enabled && (!slide.button_1_text || !slide.button_1_link);
  const button2Warn = slide.button_2_enabled && (!slide.button_2_text || !slide.button_2_link);

  function onUpdateTranslation(
    locale: Exclude<Locale, "en">,
    field: "eyebrowText" | "heading" | "subheading" | "description" | "button1Text" | "button2Text",
    value: string,
  ) {
    const current = slide.translations ?? {};
    onUpdate({
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  return (
    <div className="rounded-field border border-neutral-200 p-4">
      {/* ── Header: thumbnail, title, status, order, actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-100">
          {slide.desktop_image ? (
            <Image src={slide.desktop_image.file_url} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-small text-neutral-400">—</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{slide.heading || "(Belum ada heading)"}</p>
          <p className="text-small text-neutral-500">
            Order {String(index + 1).padStart(2, "0")} · {slide.enabled ? "Aktif" : "Nonaktif"}
          </p>
        </div>
        <Badge variant={slide.enabled ? "primary" : "neutral"}>{slide.enabled ? "Aktif" : "Nonaktif"}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
        <label className="flex items-center gap-2 text-small text-neutral-600">
          <input type="checkbox" checked={slide.enabled} onChange={onToggleActive} className="h-4 w-4" />
          Aktifkan
        </label>
        <button type="button" onClick={onPreview} className="text-small text-primary-700 underline">
          Preview
        </button>
        <button type="button" onClick={onDuplicate} className="text-small text-neutral-600 underline">
          Duplicate
        </button>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-small text-neutral-600 underline disabled:opacity-30">
          Naik
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === slideCount - 1} className="text-small text-neutral-600 underline disabled:opacity-30">
          Turun
        </button>
        <button type="button" onClick={onDelete} className="ml-auto text-small text-red-600 underline">
          Hapus
        </button>
      </div>

      {/* ── 1. Informasi Dasar ── */}
      <div className="mt-4">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">1. Informasi Dasar</p>
        <div className="mt-2">
          <Label htmlFor={`eyebrow-${slide.id}`} className="text-small">
            Label Kecil / Eyebrow (opsional)
          </Label>
          <Input
            id={`eyebrow-${slide.id}`}
            defaultValue={slide.eyebrow_text ?? ""}
            placeholder="Indonesian Coconut Exporter"
            onBlur={(e) => onUpdate({ eyebrow_text: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`heading-${slide.id}`} className="text-small">
              Heading
            </Label>
            <span className="text-small text-neutral-400">{headingLength} karakter</span>
          </div>
          <Input
            id={`heading-${slide.id}`}
            defaultValue={slide.heading}
            onChange={(e) => setHeadingLength(e.target.value.length)}
            onBlur={(e) => onUpdate({ heading: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`subheading-${slide.id}`} className="text-small">
              Sub Heading
            </Label>
            <span className="text-small text-neutral-400">{subheadingLength} karakter</span>
          </div>
          <Textarea
            id={`subheading-${slide.id}`}
            defaultValue={slide.subheading}
            rows={2}
            onChange={(e) => setSubheadingLength(e.target.value.length)}
            onBlur={(e) => onUpdate({ subheading: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <Label htmlFor={`description-${slide.id}`} className="text-small">
            Deskripsi (opsional)
          </Label>
          <Textarea
            id={`description-${slide.id}`}
            defaultValue={slide.description ?? ""}
            rows={2}
            onBlur={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
      </div>

      {/* ── 2. Gambar ── */}
      <div className="mt-4">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">2. Gambar</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MediaUploadField
            label="Gambar Desktop"
            media={slide.desktop_image}
            maxSizeBytes={HERO_IMAGE_MAX_BYTES}
            hint="Rekomendasi: 1920×1080px (16:9, cth. 1920×1080 atau 2400×1350). Maksimum 5MB."
            onChange={(media) => onUpdate({ desktop_image_id: media.id })}
            onRemove={() => onUpdate({ desktop_image_id: null })}
          />
          <div>
            <MediaUploadField
              label="Gambar Mobile (opsional)"
              media={slide.mobile_image}
              maxSizeBytes={HERO_IMAGE_MAX_BYTES}
              hint="Rekomendasi: 1080×1350px (potret 4:5, cth. 1080×1350 atau 1080×1920). Maksimum 5MB."
              onChange={(media) => onUpdate({ mobile_image_id: media.id })}
              onRemove={() => onUpdate({ mobile_image_id: null })}
            />
            {!slide.mobile_image && (
              <p className="mt-1 text-small text-neutral-500">
                Belum ada gambar mobile. Gambar desktop akan dipakai di layar mobile.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Call To Action ── */}
      <div className="mt-4">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">3. Call To Action</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-field border border-neutral-100 p-3">
            <label className="flex items-center gap-2 text-small font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={slide.button_1_enabled}
                onChange={(e) => onUpdate({ button_1_enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Tombol 1 Aktif
            </label>
            <div className="mt-2">
              <Label className="text-small">Teks</Label>
              <Input
                defaultValue={slide.button_1_text ?? ""}
                placeholder="Request Quotation"
                onBlur={(e) => onUpdate({ button_1_text: e.target.value })}
              />
            </div>
            <div className="mt-2">
              <Label className="text-small">Tautan</Label>
              <Input
                defaultValue={slide.button_1_link ?? ""}
                placeholder="/products, https://..., mailto:..., https://wa.me/..."
                onBlur={(e) => onUpdate({ button_1_link: e.target.value })}
              />
            </div>
            <div className="mt-2">
              <Label className="text-small">Gaya</Label>
              <select
                defaultValue={slide.button_1_style}
                onChange={(e) => onUpdate({ button_1_style: e.target.value })}
                className="w-full rounded-field border border-neutral-300 px-3 py-2 text-small"
              >
                {HERO_BUTTON_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {button1Warn && (
              <p className="mt-2 text-small text-amber-700">
                Tombol aktif tapi teks/tautan kosong — tombol tidak akan tampil di beranda.
              </p>
            )}
          </div>

          <div className="rounded-field border border-neutral-100 p-3">
            <label className="flex items-center gap-2 text-small font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={slide.button_2_enabled}
                onChange={(e) => onUpdate({ button_2_enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Tombol 2 Aktif
            </label>
            <div className="mt-2">
              <Label className="text-small">Teks</Label>
              <Input
                defaultValue={slide.button_2_text ?? ""}
                placeholder="View Products"
                onBlur={(e) => onUpdate({ button_2_text: e.target.value })}
              />
            </div>
            <div className="mt-2">
              <Label className="text-small">Tautan</Label>
              <Input
                defaultValue={slide.button_2_link ?? ""}
                placeholder="/products, https://..., mailto:..., https://wa.me/..."
                onBlur={(e) => onUpdate({ button_2_link: e.target.value })}
              />
            </div>
            <div className="mt-2">
              <Label className="text-small">Gaya</Label>
              <select
                defaultValue={slide.button_2_style}
                onChange={(e) => onUpdate({ button_2_style: e.target.value })}
                className="w-full rounded-field border border-neutral-300 px-3 py-2 text-small"
              >
                {HERO_BUTTON_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {button2Warn && (
              <p className="mt-2 text-small text-amber-700">
                Tombol aktif tapi teks/tautan kosong — tombol tidak akan tampil di beranda.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Tampilan ── */}
      <div className="mt-4">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">4. Tampilan</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-small">Perataan Teks</Label>
            <select
              defaultValue={slide.text_alignment}
              onChange={(e) => onUpdate({ text_alignment: e.target.value })}
              className="w-full rounded-field border border-neutral-300 px-3 py-2 text-small"
            >
              {HERO_TEXT_ALIGNMENTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-small">Overlay Gelap ({slide.overlay_opacity}%)</Label>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={slide.overlay_opacity}
              onChange={(e) => onUpdate({ overlay_opacity: Number(e.target.value) })}
              className="mt-2.5 w-full"
            />
          </div>
          <div>
            <Label className="text-small">Urutan</Label>
            <Input
              type="number"
              defaultValue={slide.order}
              onBlur={(e) => onUpdate({ order: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* ── 5. Status & Publikasi ── */}
      <div className="mt-4">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">5. Status &amp; Publikasi</p>
        <div className="mt-2">
          <Label className="text-small">Tanggal Mulai Tayang (opsional)</Label>
          <Input
            type="date"
            defaultValue={slide.publish_date?.slice(0, 10) ?? ""}
            onBlur={(e) => onUpdate({ publish_date: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* ── 6. Translations ── */}
      <details className="mt-4 border-t border-neutral-100 pt-4">
        <summary className="flex cursor-pointer items-center gap-2 text-small font-semibold uppercase tracking-wide text-neutral-500">
          6. Translations
          <HeroSlideTranslationStatus translations={slide.translations} />
        </summary>
        <div className="mt-3">
          <LocaleTabs>
            {(locale) =>
              locale === "en" ? (
                <p className="text-small text-neutral-500">
                  Bahasa Inggris diedit langsung pada field di atas (Section 1 &amp; 2).
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="text-small">Eyebrow Text</Label>
                    <Input
                      defaultValue={slide.translations?.[locale]?.eyebrowText ?? ""}
                      placeholder={slide.eyebrow_text ?? ""}
                      onBlur={(e) => onUpdateTranslation(locale, "eyebrowText", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Heading</Label>
                    <Input
                      defaultValue={slide.translations?.[locale]?.heading ?? ""}
                      placeholder={slide.heading}
                      onBlur={(e) => onUpdateTranslation(locale, "heading", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Sub Heading</Label>
                    <Textarea
                      rows={2}
                      defaultValue={slide.translations?.[locale]?.subheading ?? ""}
                      placeholder={slide.subheading}
                      onBlur={(e) => onUpdateTranslation(locale, "subheading", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Deskripsi</Label>
                    <Textarea
                      rows={2}
                      defaultValue={slide.translations?.[locale]?.description ?? ""}
                      placeholder={slide.description ?? ""}
                      onBlur={(e) => onUpdateTranslation(locale, "description", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Button 1 — Teks</Label>
                    <Input
                      defaultValue={slide.translations?.[locale]?.button1Text ?? ""}
                      placeholder={slide.button_1_text ?? ""}
                      onBlur={(e) => onUpdateTranslation(locale, "button1Text", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Button 2 — Teks</Label>
                    <Input
                      defaultValue={slide.translations?.[locale]?.button2Text ?? ""}
                      placeholder={slide.button_2_text ?? ""}
                      onBlur={(e) => onUpdateTranslation(locale, "button2Text", e.target.value)}
                    />
                  </div>
                  <p className="text-small text-neutral-500">
                    Kosongkan untuk memakai teks Inggris sebagai fallback.
                  </p>
                </div>
              )
            }
          </LocaleTabs>
        </div>
      </details>
    </div>
  );
}
