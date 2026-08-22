"use client";

import type { Media } from "@ppn/shared-types";
import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * In-Admin document preview. PDFs render in an `<object>` so a browser without a built-in PDF
 * viewer falls back to the element's own children — the metadata card plus Open/Download links
 * — instead of silently triggering a download. Image certificates use `object-contain` so the
 * document is never cropped or distorted.
 */
export function DocumentPreviewModal({
  media,
  fileSize,
  onClose,
}: {
  media: Media;
  fileSize: number | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const isPdf = media.file_type === "pdf";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${media.alt_text}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-card bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-4">
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-neutral-900">{media.alt_text}</p>
            <p className="text-small text-neutral-500">
              {isPdf ? "PDF" : "Gambar"}
              {fileSize !== null ? ` · ${formatBytes(fileSize)}` : ""} · Diunggah{" "}
              {new Date(media.uploaded_at).toLocaleDateString("id-ID")}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="shrink-0 text-small text-neutral-600 underline">
            Tutup
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-neutral-100 p-3">
          {isPdf ? (
            <object data={media.file_url} type="application/pdf" className="h-full w-full rounded-field">
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-body text-neutral-700">
                  Browser ini tidak dapat menampilkan PDF secara langsung.
                </p>
                <p className="text-small text-neutral-500">
                  {media.alt_text}
                  {fileSize !== null ? ` · ${formatBytes(fileSize)}` : ""} · PDF
                </p>
                <div className="flex items-center gap-4 text-small font-medium">
                  <a href={media.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
                    Open PDF
                  </a>
                  <a href={media.file_url} download className="text-primary-700 underline">
                    Download
                  </a>
                </div>
              </div>
            </object>
          ) : (
            <div className="relative h-full w-full">
              <Image src={media.file_url} alt={media.alt_text} fill className="object-contain" sizes="(max-width: 768px) 100vw, 768px" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-neutral-200 p-4 text-small font-medium">
          <a href={media.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
            Buka di tab baru
          </a>
          <a href={media.file_url} download className="text-primary-700 underline">
            Unduh
          </a>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
