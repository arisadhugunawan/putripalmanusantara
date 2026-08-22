"use client";

import type { ProductSnapshotSummary } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useSaveState } from "@/hooks/useSaveState";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

/** Version history + rollback for one Product — mirrors `AboutCompanyPublishHistoryCard.tsx`/
 * `PublishHistoryCard.tsx`, scoped to a single `productId` since Products is a collection, not
 * a singleton page. Snapshots are append-only, so "restore" never mutates history, just
 * re-publishes an old payload as a brand-new version. */
export function ProductsPublishHistoryCard({
  productId,
  onRestored,
}: {
  productId: string;
  onRestored?: () => void;
}) {
  const [snapshots, setSnapshots] = useState<ProductSnapshotSummary[] | null>(null);
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const { status, run } = useSaveState();
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<ProductSnapshotSummary[]>(`/admin/products/${productId}/snapshots`);
    setSnapshots(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function confirmRestore() {
    if (!restoreTargetId) return;
    const id = restoreTargetId;
    const result = await run(() =>
      adminApi.post(`/admin/products/${productId}/snapshots/${id}/restore`),
    );
    setRestoreTargetId(null);
    if (result.success) {
      showToast("Versi terpilih berhasil dipublikasikan ulang.");
      await load();
      onRestored?.();
    } else {
      showToast("Gagal memulihkan versi ini. Silakan coba lagi.", "error");
    }
  }

  if (!snapshots || snapshots.length === 0) return null;

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Product Version History</h2>
      <p className="mt-1 text-small text-neutral-600">
        Pulihkan versi produk sebelumnya jika publikasi terbaru ada yang salah.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {snapshots.map((snapshot, index) => (
          <div
            key={snapshot.id}
            className="flex items-center justify-between rounded-field border border-neutral-200 px-4 py-2.5"
          >
            <div>
              <p className="text-small font-medium text-neutral-900">
                v{snapshot.version} — {new Date(snapshot.published_at).toLocaleString("id-ID")}
                {index === 0 && <span className="ml-2 text-primary-700">(Versi Aktif)</span>}
              </p>
              <p className="text-[11px] text-neutral-500">By: {snapshot.published_by_name}</p>
            </div>
            {index !== 0 && (
              <button
                type="button"
                onClick={() => setRestoreTargetId(snapshot.id)}
                disabled={status === "saving"}
                className="text-small font-medium text-primary-700 underline disabled:opacity-50"
              >
                Restore
              </button>
            )}
          </div>
        ))}
      </div>

      {restoreTargetId && (
        <ConfirmDialog
          title="Restore this version?"
          message="Versi ini akan langsung dipublikasikan ulang sebagai versi aktif produk ini, menggantikan versi yang sekarang tayang. Versi yang sedang tayang tidak akan hilang — tetap ada di riwayat."
          confirmLabel="Restore"
          onConfirm={() => void confirmRestore()}
          onCancel={() => setRestoreTargetId(null)}
        />
      )}
    </Card>
  );
}
