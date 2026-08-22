"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { AboutCompanySettings } from "@ppn/shared-types";
import { useCallback } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

export function AboutCompanySettingsEditor() {
  const fetchSettings = useCallback(
    () => adminApi.get<AboutCompanySettings>("/admin/about-company/settings"),
    [],
  );
  const { data: settings, status, reload, retry } = useAdminResource(fetchSettings);
  const { showToast } = useToast();

  async function handleUpdate(patch: Record<string, unknown>) {
    try {
      await adminApi.put("/admin/about-company/settings", patch);
      await reload();
      showToast("Changes saved as draft.");
    } catch {
      showToast("Changes could not be saved.", "error");
    }
  }

  if (status === "error") {
    return <AdminLoadError message="Failed to load About Company settings." onRetry={() => void retry()} />;
  }

  if (status === "loading" || !settings) {
    return (
      <div className="mt-6 max-w-3xl">
        <SkeletonCard rows={4} />
      </div>
    );
  }

  return (
    <Card className="mt-6 max-w-3xl">
      <h2 className="text-h3 text-neutral-900">About Company Settings</h2>

      <div className="mt-4 flex items-center justify-between rounded-field border border-neutral-200 p-3">
        <div>
          <p className="text-body font-medium text-neutral-900">Visible on Website</p>
          <p className="text-small text-neutral-600">
            Jika dinonaktifkan, halaman About Company tidak tayang di situs publik dan tautannya hilang dari
            Header/Footer — berlaku setelah Publish, dan data tetap utuh di Admin.
          </p>
        </div>
        <label className="flex items-center gap-2 text-small text-neutral-700">
          <input type="checkbox" checked={settings.visible} onChange={(e) => void handleUpdate({ visible: e.target.checked })} className="h-4 w-4" />
          Visible
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ac-page-title">Page Title</Label>
          <Input id="ac-page-title" defaultValue={settings.page_title} onBlur={(e) => void handleUpdate({ page_title: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="ac-page-subtitle">Page Subtitle</Label>
          <Input id="ac-page-subtitle" defaultValue={settings.page_subtitle} onBlur={(e) => void handleUpdate({ page_subtitle: e.target.value })} />
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">SEO</p>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <Label htmlFor="ac-seo-title">SEO Title (opsional)</Label>
            <Input id="ac-seo-title" defaultValue={settings.seo_title ?? ""} onBlur={(e) => void handleUpdate({ seo_title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="ac-seo-desc">SEO Description (opsional)</Label>
            <Textarea id="ac-seo-desc" rows={2} defaultValue={settings.seo_description ?? ""} onBlur={(e) => void handleUpdate({ seo_description: e.target.value })} />
          </div>
          <MediaUploadField
            label="OG Image (opsional)"
            media={settings.og_image}
            onChange={(media) => void handleUpdate({ og_image_id: media.id })}
            onRemove={() => void handleUpdate({ og_image_id: null })}
            hint="Rekomendasi: 1200×630px untuk pratinjau tautan sosial media."
          />
        </div>
      </div>
    </Card>
  );
}
