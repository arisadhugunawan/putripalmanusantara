"use client";

import { cn } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import Image from "next/image";
import { useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("corrupted"));
    };
    img.src = url;
  });
}

/**
 * Strict, dedicated background-image upload — originally built for the Inner Page Header
 * system, now shared with Footer Management (each passes its own size constraints and upload
 * endpoint; every prop below defaults to the Inner Page Header's original values, so that
 * caller needed zero changes when this became reusable). Deliberately separate from the
 * generic `MediaUploadField` used everywhere else in the admin: that component only ever issues
 * a soft, dismissible resolution warning (a small image is still fine for e.g. a Facility
 * photo), while a full-bleed banner background that's too small or too heavy visibly breaks —
 * so this one hard-rejects, client-side first for instant feedback, then again for real on the
 * server (since a client-only check can always be bypassed by calling the API directly).
 */
export function BackgroundImageUpload({
  label,
  media,
  onChange,
  onRemove,
  uploadUrl = "/admin/page-headers/upload",
  recommendedWidth = 1920,
  recommendedHeight = 500,
  minWidth = 1600,
  minHeight = 400,
  maxBytes = 2 * 1024 * 1024,
  defaultAltText = "Background",
}: {
  label: string;
  media: Media | null;
  onChange: (media: Media) => void;
  onRemove: () => void;
  uploadUrl?: string;
  recommendedWidth?: number;
  recommendedHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxBytes?: number;
  defaultAltText?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported image format. Allowed: JPG, JPEG, PNG, WEBP.");
      return;
    }
    if (file.size > maxBytes) {
      setError(`Maximum file size is ${formatBytes(maxBytes)}.`);
      return;
    }

    let dimensions: { width: number; height: number };
    try {
      dimensions = await readImageDimensions(file);
    } catch {
      setError("This image file appears to be corrupted or unreadable.");
      return;
    }
    if (dimensions.width < minWidth || dimensions.height < minHeight) {
      setError(`Minimum resolution is ${minWidth}×${minHeight} px.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "alt_text",
        file.name.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " ").trim() || defaultAltText,
      );
      const uploaded = await adminApi.post<Media>(uploadUrl, formData);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-small font-medium text-neutral-700">{label}</p>

      {media && (
        <div className="mt-2">
          <div
            className="relative w-full overflow-hidden rounded-field border border-neutral-200 bg-neutral-100"
            style={{ aspectRatio: `${recommendedWidth} / ${recommendedHeight}` }}
          >
            <Image src={media.file_url} alt={media.alt_text} fill className="object-cover" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-neutral-600">
            <span>
              Original Size: {media.width && media.height ? `${media.width} × ${media.height} px` : "—"}
            </span>
            <span className="flex items-center gap-1 text-primary-700">
              <span aria-hidden="true">✓</span> Ready to use
            </span>
          </div>
          <button type="button" onClick={onRemove} className="mt-1 text-small text-red-600 underline">
            Remove Image
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "mt-2 flex flex-col items-center gap-2 rounded-field border-2 border-dashed p-6 text-center transition-colors",
          dragActive ? "border-primary-400 bg-primary-50" : "border-neutral-300 bg-neutral-50",
        )}
      >
        <p className="text-small text-neutral-600">
          Drag image here or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="font-medium text-primary-700 underline"
          >
            Choose Image
          </button>{" "}
          ·{" "}
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            disabled={uploading}
            className="font-medium text-primary-700 underline"
          >
            Choose from Media Library
          </button>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <div className="text-[11px] text-neutral-500">
          <p>
            Recommended: {recommendedWidth} × {recommendedHeight} px · Minimum: {minWidth} × {minHeight} px
          </p>
          <p>Maximum: {formatBytes(maxBytes)} · Format: JPG, JPEG, PNG, WEBP</p>
        </div>
        {uploading && <p className="text-small text-neutral-600">Uploading...</p>}
        {error && <p className="text-small text-red-600">{error}</p>}
      </div>

      {libraryOpen && (
        <MediaLibraryPickerModal
          onClose={() => setLibraryOpen(false)}
          onSelect={(selected) => {
            onChange(selected);
            setLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}
