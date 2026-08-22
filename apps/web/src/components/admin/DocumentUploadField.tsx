"use client";

import { cn, Input, Label } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface DocumentUploadFieldProps {
  label: string;
  media: Media | null;
  onChange: (media: Media) => void;
  /** Client-side size cap — 10MB default per README "Legal & Certificate". */
  maxSizeBytes?: number;
  hint?: string;
  onRemove?: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * PDF-aware upload field for Legal & Certificate / Factory documents — `MediaUploadField`
 * only ever renders an `<Image>` preview, which is wrong for a PDF (no native thumbnail).
 * Shows a document card (name/size/type/upload date + Open/Download) for PDFs, and falls
 * back to `MediaUploadField`'s own `object-contain` image-preview behavior for image-type
 * certificates (never cropped, per README "Legal & Certificate" — certificates are documents,
 * not photos). Reuses the exact same `/admin/media` upload call and size-cap pattern.
 */
export function DocumentUploadField({
  label,
  media,
  onChange,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  hint,
  onRemove,
}: DocumentUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState(media?.alt_text ?? "");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resets local state when `media` changes identity — adjusted during render (React's
  // documented pattern for "resetting state when a prop changes"), not inside an effect,
  // since a synchronous setState in an effect body causes an extra render pass.
  const [prevMediaId, setPrevMediaId] = useState(media?.id);
  if (media?.id !== prevMediaId) {
    setPrevMediaId(media?.id);
    setAltText(media?.alt_text ?? "");
    setFileSize(null);
  }

  useEffect(() => {
    if (!media) return;
    // Media doesn't persist file size — a best-effort HEAD request reads it from
    // Content-Length instead of adding a migration for one display-only field. Silently
    // shows "—" if the request fails (e.g. a storage host that doesn't return the header).
    let cancelled = false;
    fetch(media.file_url, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        const length = res.headers.get("content-length");
        if (length) setFileSize(Number(length));
      })
      .catch(() => {
        /* best-effort only */
      });
    return () => {
      cancelled = true;
    };
  }, [media]);

  async function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`Ukuran file terlalu besar. Maksimal ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const derivedAltText = altText.trim() || file.name.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " ").trim() || "Dokumen";
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
      setError(err instanceof ApiRequestError ? err.message : "Upload gagal.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>

      {media && media.file_type === "pdf" && (
        <div className="mb-2 flex items-center gap-3 rounded-field border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-white text-red-600">
            <PdfIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-medium text-neutral-900">{media.alt_text}</p>
            <p className="text-small text-neutral-500">
              PDF{fileSize !== null ? ` · ${formatBytes(fileSize)}` : ""} · Diunggah{" "}
              {new Date(media.uploaded_at).toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-small font-medium">
            <button type="button" onClick={() => setPreviewOpen(true)} className="text-primary-700 underline">
              Pratinjau
            </button>
            <a href={media.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
              Buka
            </a>
            <a href={media.file_url} download className="text-primary-700 underline">
              Unduh
            </a>
          </div>
        </div>
      )}

      {media && media.file_type === "image" && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            title="Klik untuk memperbesar"
            className="relative aspect-video w-full max-w-xs overflow-hidden rounded-field border border-neutral-200 bg-neutral-50"
          >
            <Image src={media.file_url} alt={media.alt_text} fill className="object-contain p-3" />
          </button>
        </div>
      )}

      {media && onRemove && (
        <button
          type="button"
          onClick={() => setConfirmingRemove(true)}
          className={cn("mb-2 text-small text-red-600 underline")}
        >
          Hapus File
        </button>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor={`${label}-alt`} className="text-small">
            Nama Dokumen
          </Label>
          <Input
            id={`${label}-alt`}
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="mis. Sertifikat Halal MUI"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={() => void handleFileChange()}
          disabled={uploading}
          className="text-small"
        />
      </div>
      {hint && <p className="mt-1 text-small text-neutral-500">{hint}</p>}
      {uploading && (
        <div className="mt-2" role="status">
          <p className="text-small text-neutral-600">Mengunggah...</p>
          {/* Indeterminate: the upload goes through `fetch`, which reports no progress events. */}
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary-500" />
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1 text-small text-red-600" role="alert">
          {error}
        </p>
      )}

      {previewOpen && media && (
        <DocumentPreviewModal media={media} fileSize={fileSize} onClose={() => setPreviewOpen(false)} />
      )}

      {confirmingRemove && onRemove && (
        <ConfirmDialog
          title="Delete this document?"
          message="This document will no longer appear on the public About Company page."
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirmingRemove(false);
            onRemove();
          }}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}
    </div>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <text x="12" y="17" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor">
        PDF
      </text>
    </svg>
  );
}
