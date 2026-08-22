"use client";

import { Button } from "@ppn/ui-components";
import { useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useSaveState } from "@/hooks/useSaveState";
import { ConfirmDialog } from "./ConfirmDialog";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useToast } from "./Toast";

/**
 * The one action that ever touches the public About Company page — reused identically from
 * the overview and every section editor's toolbar, mirroring `PublishHomepageButton.tsx`. A
 * failed publish leaves the previous published version untouched — true by construction, since
 * `POST /admin/about-company/publish` only ever appends a new snapshot row; it never mutates or
 * removes the one currently live.
 */
export function PublishAboutCompanyButton({ onPublished }: { onPublished?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function confirmPublish() {
    const result = await run(() => adminApi.post("/admin/about-company/publish"));
    setConfirming(false);
    if (result.success) {
      showToast("About Company berhasil dipublikasikan.");
      onPublished?.();
    } else {
      showToast("Gagal mempublikasikan About Company. Versi sebelumnya masih tayang.", "error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <SaveStateIndicator status={status} error={error} />
      <Button type="button" onClick={() => setConfirming(true)} disabled={status === "saving"}>
        {status === "saving" ? "Publishing..." : "Publish Changes"}
      </Button>
      {confirming && (
        <ConfirmDialog
          title="Publish About Company Changes?"
          message="Draf saat ini akan langsung terlihat oleh pengunjung situs, menggantikan versi terpublikasi sebelumnya."
          confirmLabel="Publish Changes"
          onConfirm={() => void confirmPublish()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
