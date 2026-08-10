"use client";

import { Button } from "@ppn/ui-components";
import { useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useSaveState } from "@/hooks/useSaveState";
import { ConfirmDialog } from "./ConfirmDialog";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useToast } from "./Toast";

/**
 * The one action that ever touches the public Homepage — reused identically from the
 * Homepage Manager overview and every Section Editor's toolbar, so there's exactly one publish
 * flow/confirmation in the whole app (see README "Homepage Manager", Rule 6: important actions
 * need confirmation). A failed publish leaves the previous published version untouched — true
 * by construction, since `POST /admin/homepage/publish` only ever appends a new snapshot row
 * inside a transaction; it never mutates or removes the one currently live.
 */
export function PublishHomepageButton({ onPublished }: { onPublished?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function confirmPublish() {
    const result = await run(() => adminApi.post("/admin/homepage/publish"));
    setConfirming(false);
    if (result.success) {
      showToast("Homepage berhasil dipublikasikan.");
      onPublished?.();
    } else {
      showToast("Gagal mempublikasikan Homepage. Versi sebelumnya masih tayang.", "error");
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
          title="Publish Homepage Changes?"
          message="Draf saat ini akan langsung terlihat oleh pengunjung situs, menggantikan versi terpublikasi sebelumnya."
          confirmLabel="Publish Changes"
          onConfirm={() => void confirmPublish()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
