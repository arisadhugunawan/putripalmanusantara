"use client";

import { cn, Input, Label } from "@ppn/ui-components";
import type { Media, MediaPolicyContext } from "@ppn/shared-types";
import { getMediaPolicy } from "@ppn/shared-types";
import Image from "next/image";
import { useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

interface MediaUploadFieldProps {
  label: string;
  media: Media | null;
  onChange: (media: Media) => void;
  /** Which centralized `MEDIA_POLICY` entry governs this field (Post-Launch Phase 3) — drives
   * the default `maxSizeBytes`/recommended-dimensions hint and is sent to the server so the
   * upload-time dimension cap uses the right ceiling for this context. Omit for a field that
   * still needs its own one-off `maxSizeBytes`/`hint` (both below still work as explicit
   * overrides on top of whatever the policy would otherwise supply). */
  context?: MediaPolicyContext;
  /** Client-side size cap — checked before the upload request is even made, on top of
   * whatever limit the server enforces. Overrides the `context` policy's `maxBytes` when both
   * are given. */
  maxSizeBytes?: number;
  /** Optional helper text under the field, e.g. "Rekomendasi: 1920×1080px". Overrides the
   * `context` policy's own generated recommendation text when both are given. */
  hint?: string;
  /** When provided, shows a "Hapus Gambar" button that clears the reference (sets it back
   * to null) without requiring a replacement upload first — omit for fields where an image
   * is mandatory (e.g. Partner Logo). */
  onRemove?: () => void;
  /** "cover" (default, unchanged for every existing caller) crops to fill the preview box —
   * right for photos. "contain" never crops and shows the whole image (transparent PNG/SVG
   * logos must never be cropped) — pass this for logo-type uploads. */
  previewFit?: "cover" | "contain";
  /** Background class behind the preview image, e.g. a light/dark/checkerboard toggle for
   * logos with transparency. Ignored when previewFit is "cover" (default plain white/border). */
  previewBackgroundClassName?: string;
  /** Recommended minimum pixel dimensions (e.g. 1280×720 for a large featured display) — checked
   * against the `width`/`height` the server already returns after upload. Shows a dismissible,
   * non-blocking warning, never rejects the upload — a small image is still usable, just softer
   * than ideal at large display sizes ("Jangan memaksa image menjadi besar secara artificial"). */
  minWidth?: number;
  minHeight?: number;
  /** File picker `accept` override — defaults to every type this shared field has ever needed
   * across its callers (images, video, PDF for Legal & Certificates). Pass `"image/*"` for a
   * field that can only ever be an image (e.g. Open Graph Image, which social platforms can
   * never render as a PDF/video) so the picker itself can't offer the wrong file type. */
  accept?: string;
}

/** Direct upload-and-attach — POST /admin/media then store the returned id (FR-CMS-03/05/08). */
export function MediaUploadField({
  label,
  media,
  onChange,
  context,
  maxSizeBytes,
  hint,
  onRemove,
  previewFit = "cover",
  previewBackgroundClassName,
  minWidth,
  minHeight,
  accept = "image/*,video/*,application/pdf",
}: MediaUploadFieldProps) {
  const policy = context ? getMediaPolicy(context) : null;
  const effectiveMaxBytes = maxSizeBytes ?? policy?.maxBytes;
  const effectiveHint =
    hint ??
    (policy
      ? `Recommended: ${policy.recommendedWidth}×${policy.recommendedHeight}px (${policy.recommendedAspectRatio}). Maximum ${(policy.maxBytes / (1024 * 1024)).toFixed(0)}MB. Accepted: ${policy.acceptedFormats.join(" / ")}. Images are automatically optimized for responsive delivery by the website.`
      : undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(null);
  const [altText, setAltText] = useState(media?.alt_text ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (effectiveMaxBytes && file.size > effectiveMaxBytes) {
      setError(`Gambar terlalu besar. Maksimum ${(effectiveMaxBytes / (1024 * 1024)).toFixed(0)}MB.`);
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
    setResolutionWarning(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", derivedAltText);
      if (context) formData.append("context", context);
      const uploaded = await adminApi.post<Media>("/admin/media", formData);
      if (
        (minWidth && uploaded.width && uploaded.width < minWidth) ||
        (minHeight && uploaded.height && uploaded.height < minHeight)
      ) {
        setResolutionWarning(
          `Gambar ${uploaded.width}×${uploaded.height}px — direkomendasikan minimal ${minWidth ?? "—"}×${minHeight ?? "—"}px agar tampil tajam.`,
        );
      }
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
      {media && (
        <div className="mb-2">
          {media.file_type === "image" ? (
            <div
              className={cn(
                "relative aspect-video w-full max-w-xs overflow-hidden rounded-field border border-neutral-200",
                previewBackgroundClassName,
              )}
            >
              <Image
                src={media.file_url}
                alt={media.alt_text}
                fill
                className={previewFit === "contain" ? "object-contain p-4" : "object-cover"}
              />
            </div>
          ) : (
            // A non-image file (e.g. a PDF picked before `accept` was scoped to this field —
            // see `accept` prop) can't be shown as an <Image>, but must still be removable —
            // otherwise the admin has no way to self-recover once one is attached.
            <p className="max-w-xs truncate rounded-field border border-neutral-200 bg-neutral-50 px-3 py-2 text-small text-neutral-600">
              {media.alt_text || media.file_url}
            </p>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 text-small text-red-600 underline"
            >
              Hapus Gambar
            </button>
          )}
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
          accept={accept}
          onChange={() => void handleFileChange()}
          disabled={uploading}
          className="text-small"
        />
      </div>
      {effectiveHint && <p className="mt-1 text-small text-neutral-500">{effectiveHint}</p>}
      {uploading && <p className="mt-1 text-small text-neutral-600">Mengunggah...</p>}
      {error && <p className="mt-1 text-small text-red-600">{error}</p>}
      {resolutionWarning && (
        <p className="mt-1 flex items-start gap-2 text-small text-amber-700">
          <span className="flex-1">{resolutionWarning}</span>
          <button
            type="button"
            onClick={() => setResolutionWarning(null)}
            className="shrink-0 underline"
          >
            Tutup
          </button>
        </p>
      )}
    </div>
  );
}
