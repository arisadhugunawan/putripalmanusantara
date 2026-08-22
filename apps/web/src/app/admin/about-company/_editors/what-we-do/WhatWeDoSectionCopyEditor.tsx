"use client";

import type { AboutCompanyWhatWeDoSection } from "@ppn/shared-types";
import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import { useCallback } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

/**
 * Heading copy for "What We Supply" (public name of the `what_we_do` section), plus the "Who
 * We Supply" sub-block's heading/description and the Buyer/Supplier CTA copy — all bundled in
 * one singleton since all three live inside the same section component on the public page.
 */
export function WhatWeDoSectionCopyEditor() {
  const fetchSection = useCallback(
    () => adminApi.get<AboutCompanyWhatWeDoSection>("/admin/about-company/what-we-do-section"),
    [],
  );
  const { data: section, status, reload, retry } = useAdminResource(fetchSection);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/what-we-do-section", patch);
      await reload();
    } catch (err) {
      showToast(
        err instanceof ApiRequestError ? err.message : "Changes could not be saved.",
        "error",
      );
      await reload();
    }
  }

  if (status === "error") {
    return <AdminLoadError message="Failed to load section content." onRetry={() => void retry()} />;
  }

  if (status === "loading" || !section) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={4} />
      </div>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">What We Supply — Judul Section</h2>
        <p className="mt-1 text-small text-neutral-600">
          Teks pembuka section, ditampilkan di atas kartu produk. Tersimpan otomatis sebagai draf.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="wws-eyebrow">Eyebrow</Label>
              <Input
                id="wws-eyebrow"
                defaultValue={section.eyebrow}
                placeholder="mis. What We Supply"
                onBlur={(e) => void handleUpdate({ eyebrow: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wws-heading">Judul</Label>
              <Input
                id="wws-heading"
                defaultValue={section.heading}
                placeholder="mis. Coconut Products for Global Markets"
                onBlur={(e) => void handleUpdate({ heading: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="wws-description">Deskripsi Pendukung</Label>
            <Textarea
              id="wws-description"
              rows={3}
              defaultValue={section.description}
              onBlur={(e) => void handleUpdate({ description: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Who We Supply — Judul Section</h2>
        <p className="mt-1 text-small text-neutral-600">
          Teks pembuka blok segmen audiens (Importers/Manufacturers/dst.) di bawah kartu produk.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="wws-who-heading">Judul</Label>
            <Input
              id="wws-who-heading"
              defaultValue={section.who_heading}
              placeholder="mis. Serving Buyers Across the Coconut Value Chain"
              onBlur={(e) => void handleUpdate({ who_heading: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="wws-who-description">Deskripsi Pendukung</Label>
            <Textarea
              id="wws-who-description"
              rows={3}
              defaultValue={section.who_description}
              onBlur={(e) => void handleUpdate({ who_description: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Buyer CTA</h2>
        <p className="mt-1 text-small text-neutral-600">
          Blok ajakan untuk pembeli — tombol utama selalu mengarah ke halaman Products yang sudah ada. Kosongkan
          Judul untuk menyembunyikan blok ini.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="wws-buyer-heading">Judul</Label>
            <Input
              id="wws-buyer-heading"
              defaultValue={section.buyer_cta_heading}
              placeholder="mis. Looking for Coconut Products?"
              onBlur={(e) => void handleUpdate({ buyer_cta_heading: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="wws-buyer-description">Deskripsi</Label>
            <Textarea
              id="wws-buyer-description"
              rows={2}
              defaultValue={section.buyer_cta_description}
              onBlur={(e) => void handleUpdate({ buyer_cta_description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="wws-buyer-button">Label Tombol</Label>
            <Input
              id="wws-buyer-button"
              defaultValue={section.buyer_cta_button_text}
              placeholder="mis. Explore Our Products"
              onBlur={(e) => void handleUpdate({ buyer_cta_button_text: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Supplier CTA</h2>
        <p className="mt-1 text-small text-neutral-600">
          Blok ajakan untuk calon pemasok — tombol mengarah ke section &ldquo;Our Supply Network&rdquo; di
          beranda. Kosongkan Judul untuk menyembunyikan blok ini.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="wws-supplier-heading">Judul</Label>
            <Input
              id="wws-supplier-heading"
              defaultValue={section.supplier_cta_heading}
              placeholder="mis. Want to Supply PPN?"
              onBlur={(e) => void handleUpdate({ supplier_cta_heading: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="wws-supplier-description">Deskripsi</Label>
            <Textarea
              id="wws-supplier-description"
              rows={2}
              defaultValue={section.supplier_cta_description}
              onBlur={(e) => void handleUpdate({ supplier_cta_description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="wws-supplier-button">Label Tombol</Label>
            <Input
              id="wws-supplier-button"
              defaultValue={section.supplier_cta_button_text}
              placeholder="mis. Our Supply Network"
              onBlur={(e) => void handleUpdate({ supplier_cta_button_text: e.target.value })}
            />
          </div>
        </div>
      </Card>
    </>
  );
}
