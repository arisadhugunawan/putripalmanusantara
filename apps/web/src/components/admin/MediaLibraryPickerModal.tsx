"use client";

import type { Media, PaginationMeta } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

const LIMIT = 24;

/**
 * "Choose from Media Library" — browses the same `/admin/media` table every upload across the
 * whole admin already writes to (Products, Facilities, Gallery, News, Factory, ...), filtered
 * to images only, so an Inner Page Header background can reuse a photo already uploaded
 * elsewhere instead of forcing a fresh upload every time.
 */
export function MediaLibraryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (media: Media) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Media[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    try {
      const result = await adminApi.getPaginated<Media[]>(
        `/admin/media?page=${targetPage}&limit=${LIMIT}&file_type=image`,
      );
      setItems(result.data);
      setMeta(result.meta);
    } catch {
      setError("Gagal memuat Media Library.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-page-change; load() sets state only inside its own async body, not synchronously in this effect
    void load(page);
  }, [load, page]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose from Media Library"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-card bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-neutral-900">Choose from Media Library</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-field px-2 py-1 text-small text-neutral-500 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {error && <p className="text-small text-red-600">{error}</p>}
          {!error && !items && <p className="text-small text-neutral-500">Memuat...</p>}
          {!error && items && items.length === 0 && (
            <p className="text-small text-neutral-500">Belum ada gambar di Media Library.</p>
          )}
          {!error && items && items.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((media) => {
                const filename = decodeURIComponent(media.file_url.split("/").pop() ?? media.file_url);
                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => onSelect(media)}
                    className="group overflow-hidden rounded-field border border-neutral-200 text-left hover:border-primary-400"
                  >
                    <div className="relative aspect-video w-full bg-neutral-50">
                      <Image src={media.file_url} alt={media.alt_text} fill className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/0 text-small font-medium text-white opacity-0 transition-opacity group-hover:bg-neutral-900/50 group-hover:opacity-100">
                        Use Image
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[11px] font-medium text-neutral-700" title={filename}>
                        {filename}
                      </p>
                      {media.width && media.height && (
                        <p className="text-[11px] text-neutral-400">
                          {media.width}×{media.height}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {meta && meta.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-small text-neutral-500">
              {page} / {meta.total_pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={page >= meta.total_pages}
              className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
