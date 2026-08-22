"use client";

import { getMediaPolicy } from "@ppn/shared-types";
import type { AboutCompanyProfile } from "@ppn/shared-types";
import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import Link from "next/link";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_IMAGE_BYTES = getMediaPolicy("general").maxBytes;

type UpdateFn = (patch: Record<string, unknown>) => void;

/** Shared header for a block card: title, one-line purpose, and the block's own on/off switch. */
function BlockCard({
  title,
  description,
  visibleField,
  profile,
  onUpdate,
  children,
}: {
  title: string;
  description: string;
  /** Omit for a block that is always rendered (the Introduction). */
  visibleField?: keyof AboutCompanyProfile;
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
  children: React.ReactNode;
}) {
  const visible = visibleField ? Boolean(profile[visibleField]) : true;

  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h3 text-neutral-900">{title}</h2>
          <p className="mt-1 text-small text-neutral-600">{description}</p>
        </div>
        {visibleField && (
          <label className="flex shrink-0 items-center gap-2 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => onUpdate({ [visibleField]: event.target.checked })}
              className="h-4 w-4"
            />
            Tampilkan blok ini
          </label>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/** 01 — Introduction. */
export function IntroductionEditor({
  profile,
  onUpdate,
}: {
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
}) {
  return (
    <BlockCard
      title="01 · Introduction"
      description="Blok pembuka section — eyebrow, judul, subjudul, deskripsi singkat, gambar utama, dan satu CTA."
      profile={profile}
      onUpdate={onUpdate}
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-eyebrow">Eyebrow</Label>
            <Input
              id="ac-eyebrow"
              defaultValue={profile.eyebrow}
              placeholder="mis. Who We Are"
              onBlur={(e) => onUpdate({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-headline">Judul (Nama Perusahaan)</Label>
            <Input
              id="ac-headline"
              defaultValue={profile.headline}
              onBlur={(e) => onUpdate({ headline: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ac-subheading">Subjudul</Label>
          <Input
            id="ac-subheading"
            defaultValue={profile.subheading}
            placeholder="mis. Indonesian Coconut Products for Global Markets"
            onBlur={(e) => onUpdate({ subheading: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="ac-short">Deskripsi Singkat</Label>
          <Textarea
            id="ac-short"
            rows={3}
            defaultValue={profile.short_description}
            onBlur={(e) => onUpdate({ short_description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-cta-label">Label CTA (opsional)</Label>
            <Input
              id="ac-cta-label"
              defaultValue={profile.cta_label ?? ""}
              placeholder="mis. Explore Our Products"
              onBlur={(e) => onUpdate({ cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-cta-href">Tautan CTA (opsional)</Label>
            <Input
              id="ac-cta-href"
              defaultValue={profile.cta_href ?? ""}
              placeholder="mis. /products"
              onBlur={(e) => onUpdate({ cta_href: e.target.value })}
            />
            <p className="mt-1 text-small text-neutral-500">
              Tombol hanya tampil jika label dan tautan sama-sama diisi.
            </p>
          </div>
        </div>
        <MediaUploadField
          label="Gambar Utama"
          media={profile.main_image}
          onChange={(media) => onUpdate({ main_image_id: media.id })}
          onRemove={() => onUpdate({ main_image_id: null })}
          maxSizeBytes={MAX_IMAGE_BYTES}
          hint="Rekomendasi: 1600×1000px atau 1920×1200px (landscape). Maksimum 5MB."
        />
        <div>
          <Label htmlFor="ac-youtube-url">Video YouTube (opsional)</Label>
          <Input
            id="ac-youtube-url"
            defaultValue={profile.youtube_video_url ?? ""}
            placeholder="mis. https://youtu.be/xxxxxxxxxxx"
            onBlur={(e) => onUpdate({ youtube_video_url: e.target.value || null })}
          />
          <p className="mt-1 text-small text-neutral-500">
            Tempel tautan YouTube dalam format apa pun (watch, youtu.be, embed, shorts) — ID video diekstrak otomatis
            di halaman publik. Kosongkan untuk menyembunyikan video.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <div>
            <Label htmlFor="ac-social-label">Label Baris Sosial</Label>
            <Input
              id="ac-social-label"
              defaultValue={profile.social_label}
              placeholder="mis. Connect With PPN"
              onBlur={(e) => onUpdate({ social_label: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-small text-neutral-700">
            <input
              type="checkbox"
              checked={profile.social_visible}
              onChange={(event) => onUpdate({ social_visible: event.target.checked })}
              className="h-4 w-4"
            />
            Tampilkan baris ikon sosial
          </label>
        </div>
        <p className="text-small text-neutral-500">
          Ikon sosial media dikelola di blok <strong>“Connect With PPN — Social Links”</strong> di bawah section ini.
        </p>
      </div>
    </BlockCard>
  );
}

/** 02 — Company Story. */
export function CompanyStoryEditor({
  profile,
  onUpdate,
}: {
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
}) {
  return (
    <BlockCard
      title="02 · Company Story"
      description="Cerita perusahaan dengan gambar pendamping. Visi & Misi ikut tampil di blok ini."
      visibleField="story_visible"
      profile={profile}
      onUpdate={onUpdate}
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-story-label">Label Blok</Label>
            <Input
              id="ac-story-label"
              defaultValue={profile.story_label}
              onBlur={(e) => onUpdate({ story_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-story-heading">Judul</Label>
            <Input
              id="ac-story-heading"
              defaultValue={profile.story_heading}
              onBlur={(e) => onUpdate({ story_heading: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ac-story-desc">Deskripsi</Label>
          <Textarea
            id="ac-story-desc"
            rows={4}
            defaultValue={profile.story_description}
            onBlur={(e) => onUpdate({ story_description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="ac-story-desc2">Deskripsi Tambahan (opsional)</Label>
          <Textarea
            id="ac-story-desc2"
            rows={3}
            defaultValue={profile.story_secondary_description}
            onBlur={(e) => onUpdate({ story_secondary_description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-vision">Visi</Label>
            <Textarea
              id="ac-vision"
              rows={3}
              defaultValue={profile.vision}
              onBlur={(e) => onUpdate({ vision: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-mission">Misi</Label>
            <Textarea
              id="ac-mission"
              rows={3}
              defaultValue={profile.mission}
              onBlur={(e) => onUpdate({ mission: e.target.value })}
            />
          </div>
        </div>
        <MediaUploadField
          label="Gambar Cerita"
          media={profile.story_image}
          onChange={(media) => onUpdate({ story_image_id: media.id })}
          onRemove={() => onUpdate({ story_image_id: null })}
          maxSizeBytes={MAX_IMAGE_BYTES}
          hint="Rekomendasi: 1600×1000px. Maksimum 5MB."
        />
      </div>
    </BlockCard>
  );
}

/** 03 — Business Scope (copy only; the cards come from the "What We Supply" section). */
export function BusinessScopeEditor({
  profile,
  onUpdate,
}: {
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
}) {
  return (
    <BlockCard
      title="03 · Business Scope"
      description="Menampilkan kartu dari section “What We Supply” di dalam profil perusahaan."
      visibleField="scope_visible"
      profile={profile}
      onUpdate={onUpdate}
    >
      <div className="mb-4 rounded-field border border-amber-300 bg-amber-50 p-3">
        <p className="text-small text-amber-900">
          Isi kartunya diambil dari section <strong>What We Supply</strong> — tidak diduplikasi di sini, jadi cukup
          dikelola di satu tempat.{" "}
          <Link href="/admin/about-company/what_we_do" className="font-medium underline">
            Kelola What We Supply
          </Link>
        </p>
        <p className="mt-1.5 text-small text-amber-900">
          Blok ini <strong>nonaktif secara default</strong>: “What We Supply” juga tampil sebagai section tersendiri
          di halaman About. Jika blok ini diaktifkan, pertimbangkan menyembunyikan section “What We Supply” agar
          isinya tidak muncul dua kali.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-scope-label">Label Blok</Label>
            <Input
              id="ac-scope-label"
              defaultValue={profile.scope_label}
              onBlur={(e) => onUpdate({ scope_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-scope-heading">Judul</Label>
            <Input
              id="ac-scope-heading"
              defaultValue={profile.scope_heading}
              onBlur={(e) => onUpdate({ scope_heading: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ac-scope-desc">Deskripsi (opsional)</Label>
          <Textarea
            id="ac-scope-desc"
            rows={2}
            defaultValue={profile.scope_description}
            onBlur={(e) => onUpdate({ scope_description: e.target.value })}
          />
        </div>
      </div>
    </BlockCard>
  );
}

/** 06/07 — Global Export Reach (copy only; the countries come from the shared list). */
export function ExportReachEditor({
  profile,
  onUpdate,
  destinationCount,
}: {
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
  destinationCount: number | null;
}) {
  return (
    <BlockCard
      title="06 · Global Export Reach"
      description="Peta dunia interaktif berisi negara tujuan ekspor PPN."
      visibleField="export_visible"
      profile={profile}
      onUpdate={onUpdate}
    >
      <div className="mb-4 rounded-field border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-small text-neutral-700">
          Negara tujuan ekspor memakai daftar yang sama dengan section “Global Export Reach” di beranda — satu
          daftar negara untuk seluruh situs, jadi keduanya tidak mungkin berbeda.{" "}
          <Link href="/admin/homepage/export_reach" className="font-medium text-primary-700 underline">
            Kelola Negara Tujuan Ekspor
          </Link>
        </p>
        <p className="mt-1.5 text-small text-neutral-600">
          {destinationCount === null
            ? "Memuat jumlah negara aktif..."
            : `${destinationCount} negara aktif akan tampil di peta. Hanya negara berstatus “Active Destination” dan Enabled yang pernah ditampilkan.`}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-export-label">Label Blok</Label>
            <Input
              id="ac-export-label"
              defaultValue={profile.export_label}
              onBlur={(e) => onUpdate({ export_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-export-heading">Judul</Label>
            <Input
              id="ac-export-heading"
              defaultValue={profile.export_heading}
              onBlur={(e) => onUpdate({ export_heading: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ac-export-desc">Deskripsi (opsional)</Label>
          <Textarea
            id="ac-export-desc"
            rows={2}
            defaultValue={profile.export_description}
            onBlur={(e) => onUpdate({ export_description: e.target.value })}
          />
        </div>
      </div>
    </BlockCard>
  );
}

/** 08 — Legal / company information. */
export function LegalInfoEditor({
  profile,
  onUpdate,
}: {
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
}) {
  return (
    <BlockCard
      title="08 · Company Information"
      description="Data legal perusahaan. Field yang dikosongkan tidak akan tampil sama sekali di halaman publik."
      visibleField="legal_visible"
      profile={profile}
      onUpdate={onUpdate}
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-legal-label">Label Blok</Label>
            <Input
              id="ac-legal-label"
              defaultValue={profile.legal_label}
              onBlur={(e) => onUpdate({ legal_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-legal-heading">Judul (opsional)</Label>
            <Input
              id="ac-legal-heading"
              defaultValue={profile.legal_heading}
              onBlur={(e) => onUpdate({ legal_heading: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-business-type">Jenis Usaha</Label>
            <Input
              id="ac-business-type"
              defaultValue={profile.business_type}
              placeholder="mis. Agricultural & Coconut Export"
              onBlur={(e) => onUpdate({ business_type: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-established">Tahun Berdiri</Label>
            <Input
              id="ac-established"
              defaultValue={profile.established_year}
              onBlur={(e) => onUpdate({ established_year: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-business-id">Nomor Induk Berusaha (NIB)</Label>
            <Input
              id="ac-business-id"
              defaultValue={profile.business_id_number}
              onBlur={(e) => onUpdate({ business_id_number: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ac-address">Alamat Terdaftar</Label>
          <Textarea
            id="ac-address"
            rows={2}
            defaultValue={profile.registered_address}
            onBlur={(e) => onUpdate({ registered_address: e.target.value })}
          />
        </div>
        <p className="text-small text-neutral-500">
          Isi hanya data yang benar-benar dimiliki perusahaan — biarkan kosong jika belum tersedia. Dokumen legal
          dan sertifikat dikelola di section{" "}
          <Link href="/admin/about-company/legal_certificate" className="font-medium text-primary-700 underline">
            Legal &amp; Certificate
          </Link>
          ; blok ini hanya menautkannya, tidak menduplikasi galerinya.
        </p>
      </div>
    </BlockCard>
  );
}

/** 09 — Closing statement. */
export function ClosingStatementEditor({
  profile,
  onUpdate,
}: {
  profile: AboutCompanyProfile;
  onUpdate: UpdateFn;
}) {
  return (
    <BlockCard
      title="09 · Closing Statement"
      description="Penutup section dengan latar hijau tua dan satu CTA opsional."
      visibleField="closing_visible"
      profile={profile}
      onUpdate={onUpdate}
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-closing-label">Label (opsional)</Label>
            <Input
              id="ac-closing-label"
              defaultValue={profile.closing_label}
              onBlur={(e) => onUpdate({ closing_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-closing-heading">Judul</Label>
            <Input
              id="ac-closing-heading"
              defaultValue={profile.closing_heading}
              placeholder="mis. From Indonesia to Global Markets"
              onBlur={(e) => onUpdate({ closing_heading: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ac-closing-desc">Deskripsi</Label>
          <Textarea
            id="ac-closing-desc"
            rows={3}
            defaultValue={profile.closing_description}
            onBlur={(e) => onUpdate({ closing_description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-closing-cta-label">Label CTA (opsional)</Label>
            <Input
              id="ac-closing-cta-label"
              defaultValue={profile.closing_cta_label ?? ""}
              onBlur={(e) => onUpdate({ closing_cta_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ac-closing-cta-href">Tautan CTA (opsional)</Label>
            <Input
              id="ac-closing-cta-href"
              defaultValue={profile.closing_cta_href ?? ""}
              placeholder="mis. /contact"
              onBlur={(e) => onUpdate({ closing_cta_href: e.target.value })}
            />
          </div>
        </div>
      </div>
    </BlockCard>
  );
}
