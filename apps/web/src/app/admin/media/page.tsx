"use client";

import { Badge, Button, Card, cn, Input } from "@ppn/ui-components";
import type { Media, MediaFileType, MediaUsage, PaginationMeta } from "@ppn/shared-types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAuth } from "@/lib/admin/auth-context";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const TYPE_FILTERS: { value: MediaFileType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "pdf", label: "Documents" },
];

const STATUS_TABS: { value: "active" | "trash"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trash", label: "Trash" },
];

const LIMIT = 24;

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFormat(fileUrl: string, fileType: MediaFileType): string {
  const ext = fileUrl.split(".").pop()?.toUpperCase().split("?")[0];
  return ext || fileType.toUpperCase();
}

/** Every file uploaded across every admin module (Products, Facilities, Gallery, News, Factory,
 * ...) shares one `Media` table and one upload endpoint (`MediaUploadField.tsx` everywhere) — this
 * page is simply a searchable, filterable window onto that same table, not a separate storage
 * system.
 *
 * "Delete" here moves a file to Trash (Post-Launch Phase 3) — recoverable, never immediately
 * destructive. Permanent removal is a separate, explicitly-guarded action from within a media
 * item's detail view, blocked outright if the file is still referenced live (`MEDIA_IN_USE`) or
 * by a published Product's version history (`MEDIA_IN_VERSION_HISTORY`) — the latter is exactly
 * the gap the Phase 3 architecture plan flagged: a file no live relation points to anymore can
 * still be the image an old, restorable Product version shows. */
export default function AdminMediaLibraryPage() {
  const [items, setItems] = useState<Media[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaFileType | "all">("all");
  const [page, setPage] = useState(1);
  const [detailTarget, setDetailTarget] = useState<Media | null>(null);
  const [trashTarget, setTrashTarget] = useState<Media | null>(null);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Media | null>(null);
  const [permanentDeleteError, setPermanentDeleteError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { admin } = useAuth();
  // Server-side is the real guard (RolesGuard on DELETE :id/permanent) — this only avoids
  // showing an editor a button that would 403.
  const canPermanentDelete = admin?.role === "super_admin";

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), status: tab });
      if (search.trim()) params.set("q", search.trim());
      if (typeFilter !== "all") params.set("file_type", typeFilter);
      const result = await adminApi.getPaginated<Media[]>(`/admin/media?${params}`);
      setItems(result.data);
      setMeta(result.meta);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [page, search, typeFilter, tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-filter-change; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  // Filter/tab/search changes always jump back to page 1 — a stale page number past the new
  // (smaller) result set would otherwise show an empty grid with no way back. Adjusted during
  // render (React's documented pattern for state that must reset when a prop/dependency
  // changes) rather than in an effect, so it can't trigger an extra render pass.
  const [prevFilters, setPrevFilters] = useState({ search, typeFilter, tab });
  if (prevFilters.search !== search || prevFilters.typeFilter !== typeFilter || prevFilters.tab !== tab) {
    setPrevFilters({ search, typeFilter, tab });
    if (page !== 1) setPage(1);
  }

  async function handleTrash() {
    if (!trashTarget) return;
    setTrashError(null);
    try {
      await adminApi.delete(`/admin/media/${trashTarget.id}`);
      setTrashTarget(null);
      setDetailTarget(null);
      await load();
      showToast("Media dipindahkan ke Trash.");
    } catch (err) {
      setTrashError(
        err instanceof ApiRequestError ? err.message : "Gagal memindahkan media ke Trash.",
      );
    }
  }

  async function handleRestore(media: Media) {
    try {
      await adminApi.post(`/admin/media/${media.id}/restore`);
      setDetailTarget(null);
      await load();
      showToast("Media dipulihkan dari Trash.");
    } catch {
      showToast("Gagal memulihkan media. Silakan coba lagi.", "error");
    }
  }

  async function handlePermanentDelete() {
    if (!permanentDeleteTarget) return;
    setPermanentDeleteError(null);
    try {
      await adminApi.delete(`/admin/media/${permanentDeleteTarget.id}/permanent`);
      setPermanentDeleteTarget(null);
      setDetailTarget(null);
      await load();
      showToast("Media dihapus permanen.");
    } catch (err) {
      setPermanentDeleteError(
        err instanceof ApiRequestError
          ? err.message
          : "Gagal menghapus media secara permanen. Silakan coba lagi.",
      );
    }
  }

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Media Library</h1>
      <p className="mt-1 text-body text-neutral-600">
        Semua file yang pernah diunggah di seluruh Admin — Products, Facilities, Gallery, News,
        Factory, dan lainnya — berbagi satu pustaka yang sama.
      </p>

      <div className="mt-6 flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-t-field border-b-2 px-4 py-2 text-small font-medium transition-colors",
              tab === t.value
                ? "border-primary-500 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="mt-0 rounded-tl-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan alt text..."
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setTypeFilter(filter.value)}
                className={cn(
                  "rounded-button px-3 py-1.5 text-small font-medium transition-colors",
                  typeFilter === filter.value ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {status === "error" && <AdminLoadError message="Gagal memuat media library." onRetry={() => void load()} />}

        {status === "loading" && (
          <div className="mt-4">
            <SkeletonListRows rows={4} />
          </div>
        )}

        {status === "ready" && items && (
          <>
            {items.length === 0 ? (
              <div className="mt-6 rounded-field border border-dashed border-neutral-300 p-10 text-center">
                <p className="text-body text-neutral-600">
                  {tab === "trash" ? "Trash kosong." : "Tidak ada media yang cocok."}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {items.map((media) => (
                  <MediaCard key={media.id} media={media} onOpen={() => setDetailTarget(media)} />
                ))}
              </div>
            )}

            {meta && meta.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-small text-neutral-500">
                  {page} / {meta.total_pages} · {meta.total} file
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
          </>
        )}
      </Card>

      {detailTarget && (
        <MediaDetailModal
          media={detailTarget}
          isTrash={tab === "trash"}
          canPermanentDelete={canPermanentDelete}
          onClose={() => setDetailTarget(null)}
          onTrash={() => setTrashTarget(detailTarget)}
          onRestore={() => void handleRestore(detailTarget)}
          onPermanentDelete={() => setPermanentDeleteTarget(detailTarget)}
        />
      )}

      {trashTarget && (
        <ConfirmDialog
          title="Pindahkan ke Trash?"
          message={
            trashError ??
            "File akan disembunyikan dari Media Library aktif tapi tidak dihapus — bisa dipulihkan kapan saja dari tab Trash."
          }
          confirmLabel="Pindahkan ke Trash"
          onConfirm={() => void handleTrash()}
          onCancel={() => {
            setTrashTarget(null);
            setTrashError(null);
          }}
        />
      )}

      {permanentDeleteTarget && (
        <ConfirmDialog
          title="Hapus permanen?"
          message={
            permanentDeleteError ??
            "Tindakan ini TIDAK DAPAT DIBATALKAN. File dan datanya akan dihapus sepenuhnya dari server."
          }
          confirmLabel="Hapus Permanen"
          onConfirm={() => void handlePermanentDelete()}
          onCancel={() => {
            setPermanentDeleteTarget(null);
            setPermanentDeleteError(null);
          }}
        />
      )}
    </div>
  );
}

function MediaCard({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const filename = decodeURIComponent(media.file_url.split("/").pop() ?? media.file_url);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-field border border-neutral-200 bg-white text-left transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-neutral-50">
        {media.file_type === "image" ? (
          <Image src={media.file_url} alt={media.alt_text} fill sizes="200px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-small font-medium text-neutral-400">
            {media.file_type === "video" ? "▶ Video" : "PDF"}
          </div>
        )}
        {media.deleted_at && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
            Trashed
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-small font-medium text-neutral-900" title={filename}>
          {filename}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="neutral">{media.file_type}</Badge>
          {media.width && media.height && (
            <span className="text-[11px] text-neutral-400">
              {media.width}×{media.height}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">{formatBytes(media.size_bytes)}</p>
        {!media.alt_text.trim() && (
          <p className="mt-1 text-[11px] text-amber-700">⚠ Alt text missing</p>
        )}
      </div>
    </button>
  );
}

function MediaDetailModal({
  media,
  isTrash,
  canPermanentDelete,
  onClose,
  onTrash,
  onRestore,
  onPermanentDelete,
}: {
  media: Media;
  isTrash: boolean;
  canPermanentDelete: boolean;
  onClose: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  const [usage, setUsage] = useState<MediaUsage | null>(null);
  const [usageStatus, setUsageStatus] = useState<"loading" | "ready" | "error">("loading");
  const filename = decodeURIComponent(media.file_url.split("/").pop() ?? media.file_url);

  useEffect(() => {
    // Usage is fetched only when this detail view actually opens — never for every card in
    // the grid — since it runs ~30 relation queries plus a snapshot-history scan.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-id-change; the async body below sets the "ready"/"error" state, this just marks the start
    setUsageStatus("loading");
    adminApi
      .get<MediaUsage>(`/admin/media/${media.id}/usage`)
      .then((data) => {
        setUsage(data);
        setUsageStatus("ready");
      })
      .catch(() => setUsageStatus("error"));
  }, [media.id]);

  const totalUsage = (usage?.live.length ?? 0) + (usage?.version_history.length ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-h3 text-neutral-900">Media Details</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-field bg-neutral-50">
          {media.file_type === "image" ? (
            <Image src={media.file_url} alt={media.alt_text} fill sizes="600px" className="object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-body font-medium text-neutral-400">
              {media.file_type === "video" ? "▶ Video" : "PDF Document"}
            </div>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-small">
          <dt className="text-neutral-500">Filename</dt>
          <dd className="truncate text-neutral-900" title={filename}>{filename}</dd>
          <dt className="text-neutral-500">Format</dt>
          <dd className="text-neutral-900">{formatFormat(media.file_url, media.file_type)}</dd>
          <dt className="text-neutral-500">Dimensions</dt>
          <dd className="text-neutral-900">{media.width && media.height ? `${media.width} × ${media.height} px` : "—"}</dd>
          <dt className="text-neutral-500">File Size</dt>
          <dd className="text-neutral-900">{formatBytes(media.size_bytes)}</dd>
          <dt className="text-neutral-500">Uploaded</dt>
          <dd className="text-neutral-900">{new Date(media.uploaded_at).toLocaleString("id-ID")}</dd>
          <dt className="text-neutral-500">Alt Text</dt>
          <dd className="text-neutral-900">{media.alt_text || <span className="text-amber-700">⚠ Missing</span>}</dd>
        </dl>

        <div className="mt-5 border-t border-neutral-100 pt-4">
          <h3 className="text-small font-medium uppercase tracking-wide text-neutral-500">Usage</h3>
          {usageStatus === "loading" && <p className="mt-2 text-small text-neutral-500">Memeriksa penggunaan...</p>}
          {usageStatus === "error" && <p className="mt-2 text-small text-red-600">Gagal memuat data penggunaan.</p>}
          {usageStatus === "ready" && usage && (
            <>
              {totalUsage === 0 ? (
                <p className="mt-2 text-small text-neutral-500">Tidak digunakan di mana pun — aman untuk dihapus.</p>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  {usage.live.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-primary-700">Live</p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {usage.live.map((ref, i) => (
                          <li key={i} className="text-small text-neutral-700">
                            <span className="text-neutral-400">{ref.module} — </span>
                            {ref.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {usage.version_history.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Version History</p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {usage.version_history.map((ref, i) => (
                          <li key={i} className="text-small text-neutral-700">
                            {ref.content_label} — v{ref.version}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-100 pt-4">
          {isTrash ? (
            <>
              <Button type="button" variant="secondary" onClick={onRestore}>
                Restore
              </Button>
              {canPermanentDelete && (
                <button type="button" onClick={onPermanentDelete} className="text-small font-medium text-red-600 underline">
                  Permanent Delete
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={onTrash} className="text-small font-medium text-red-600 underline">
              Move to Trash
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
