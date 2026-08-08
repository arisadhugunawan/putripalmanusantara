"use client";

import { Input, Label } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import Image from "next/image";
import { useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

interface MediaUploadFieldProps {
  label: string;
  media: Media | null;
  onChange: (media: Media) => void;
  /** Client-side size cap (e.g. hero images: 5MB) — checked before the upload request is
   * even made, on top of whatever limit the server enforces. */
  maxSizeBytes?: number;
  /** Optional helper text under the field, e.g. "Rekomendasi: 1920×1080px". */
  hint?: string;
}

/** Direct upload-and-attach — POST /admin/media then store the returned id (FR-CMS-03/05/08). */
export function MediaUploadField({ label, media, onChange, maxSizeBytes, hint }: MediaUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState(media?.alt_text ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`Gambar terlalu besar. Maksimum ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Alt text is mandatory server-side (NFR-SEO-06/A11Y-03), but the admin shouldn't have
    // to stop and type one just to upload a file — derive a reasonable default from the
    // file name (editable afterwards) so picking a file is the only step required.
    const derivedAltText = altText.trim() || file.name.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " ").trim() || "Gambar";
    if (!altText.trim()) setAltText(derivedAltText);

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", derivedAltText);
      const uploaded = await adminApi.post<Media>("/admin/media", formData);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal mengunggah file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {media && media.file_type === "image" && (
        <div className="relative mb-2 aspect-video w-full max-w-xs overflow-hidden rounded-field border border-neutral-200">
          <Image src={media.file_url} alt={media.alt_text} fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor={`${label}-alt`} className="text-small">
            Teks Alternatif (Alt Text)
          </Label>
          <Input
            id={`${label}-alt`}
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Deskripsi gambar untuk SEO & aksesibilitas"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          onChange={() => void handleFileChange()}
          disabled={uploading}
          className="text-small"
        />
      </div>
      {hint && <p className="mt-1 text-small text-neutral-500">{hint}</p>}
      {uploading && <p className="mt-1 text-small text-neutral-600">Mengunggah...</p>}
      {error && <p className="mt-1 text-small text-red-600">{error}</p>}
    </div>
  );
}
