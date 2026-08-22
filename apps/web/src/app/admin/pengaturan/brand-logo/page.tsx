"use client";

import type { SiteBranding } from "@ppn/shared-types";
import { getMediaPolicy } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogoCard } from "@/components/admin/BrandLogoCard";
import { adminApi } from "@/lib/admin/client";

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3) — was a locally
// hardcoded constant here before, duplicated with the same value across several other
// admin editors.
const LOGO_MAX_SIZE_BYTES = getMediaPolicy("logo").maxBytes;
const FAVICON_MAX_SIZE_BYTES = getMediaPolicy("favicon").maxBytes;
const DEFAULT_ALT_TEXT = "CV. Putri Palma Nusantara";

export default function BrandLogoPage() {
  const [branding, setBranding] = useState<SiteBranding | null>(null);

  async function load() {
    const data = await adminApi.get<SiteBranding>("/admin/branding");
    setBranding(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  if (!branding) return <p className="text-body text-neutral-600">Memuat...</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/pengaturan" className="text-small text-neutral-600 underline underline-offset-2">
        ← Kembali ke Pengaturan
      </Link>
      <h1 className="mt-2 text-h2 text-neutral-900">Brand & Logo</h1>
      <p className="mt-2 text-body text-neutral-600">
        Kelola logo yang digunakan pada Header, Footer, dan identitas website.
      </p>

      <div className="mt-6 flex flex-col gap-6 pb-10">
        <BrandLogoCard
          title="Logo Header"
          description="Tampil di kiri Header pada seluruh halaman public website."
          hint="SVG (disarankan) atau PNG transparan, rasio ±3:1 (mis. 1200×400px). Tampil di layar pada 180–240px lebar."
          media={branding.header_logo}
          altText={branding.header_logo_alt}
          defaultAltText={DEFAULT_ALT_TEXT}
          maxSizeBytes={LOGO_MAX_SIZE_BYTES}
          toggle={{ label: "Aktif", checked: branding.header_logo_enabled }}
          onSave={({ mediaId, altText, toggleChecked }) =>
            adminApi.put<SiteBranding>("/admin/branding", {
              header_logo_id: mediaId,
              header_logo_alt: altText,
              header_logo_enabled: toggleChecked,
            })
          }
          onResetToDefault={() => adminApi.put<SiteBranding>("/admin/branding/reset/header", {})}
        />

        <BrandLogoCard
          title="Logo Footer"
          description="Tampil pada Footer. Boleh berbeda dari Logo Header."
          hint="SVG (disarankan) atau PNG transparan, rasio ±3:1 (mis. 1200×400px). Tampil di layar pada 180–260px lebar."
          media={branding.footer_logo}
          altText={branding.footer_logo_alt}
          defaultAltText={DEFAULT_ALT_TEXT}
          maxSizeBytes={LOGO_MAX_SIZE_BYTES}
          toggle={{ label: "Aktif", checked: branding.footer_logo_enabled }}
          onSave={({ mediaId, altText, toggleChecked }) =>
            adminApi.put<SiteBranding>("/admin/branding", {
              footer_logo_id: mediaId,
              footer_logo_alt: altText,
              footer_logo_enabled: toggleChecked,
            })
          }
          onResetToDefault={() => adminApi.put<SiteBranding>("/admin/branding/reset/footer", {})}
        />

        <BrandLogoCard
          title="Logo Mobile"
          description="Versi logo khusus untuk layar mobile. Jika tidak diaktifkan, Logo Header dipakai sebagai fallback."
          hint="SVG (disarankan) atau PNG transparan, mis. 800×300px. Tampil di layar pada 120–180px lebar."
          media={branding.mobile_logo}
          altText={branding.mobile_logo_alt}
          defaultAltText={DEFAULT_ALT_TEXT}
          maxSizeBytes={LOGO_MAX_SIZE_BYTES}
          toggle={{ label: "Gunakan logo khusus mobile", checked: branding.use_mobile_logo }}
          onSave={({ mediaId, altText, toggleChecked }) =>
            adminApi.put<SiteBranding>("/admin/branding", {
              mobile_logo_id: mediaId,
              mobile_logo_alt: altText,
              use_mobile_logo: toggleChecked,
            })
          }
          onResetToDefault={() => adminApi.put<SiteBranding>("/admin/branding/reset/mobile", {})}
        />

        <BrandLogoCard
          title="Favicon / Site Icon"
          description="Ikon tab browser. Sumber disarankan 512×512px — browser akan melakukan scaling otomatis (16/32/48px)."
          hint="PNG, SVG, atau ICO. Sumber 512×512px."
          media={branding.favicon}
          altText=""
          defaultAltText=""
          maxSizeBytes={FAVICON_MAX_SIZE_BYTES}
          showAltText={false}
          onSave={({ mediaId }) => adminApi.put<SiteBranding>("/admin/branding", { favicon_id: mediaId })}
          onResetToDefault={() => adminApi.put<SiteBranding>("/admin/branding/reset/favicon", {})}
        />

        <div className="rounded-card border border-dashed border-neutral-300 p-5 text-body text-neutral-600">
          Background header halaman Detail Produk kini dikelola di{" "}
          <Link href="/admin/pengaturan/page-header/product-detail" className="text-primary-700 underline">
            Settings → Inner Page Header → Product Detail
          </Link>
          , bersama pengaturan overlay, posisi, tinggi, dan warna yang lebih lengkap.
        </div>
      </div>
    </div>
  );
}
