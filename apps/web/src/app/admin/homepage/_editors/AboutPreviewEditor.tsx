"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { HomepageAboutPreview, HomepageVideoSource } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

const VIDEO_SOURCES: { value: HomepageVideoSource; label: string }[] = [
  { value: "none", label: "Belum ada video" },
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "upload", label: "Unggah File" },
];


export function AboutPreviewEditor() {
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
