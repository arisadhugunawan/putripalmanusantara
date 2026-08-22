"use client";

import { Button } from "@ppn/ui-components";
import { useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useSaveState } from "@/hooks/useSaveState";
import { ConfirmDialog } from "./ConfirmDialog";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useToast } from "./Toast";

/**
 * The one action that ever moves a Product's draft onto the public site — mirrors
 * `PublishAboutCompanyButton.tsx`/`PublishHomepageButton.tsx`, adapted for Products being a
 * per-item collection rather than a singleton (hence the `productId` prop). A failed publish
 * leaves the previous published version untouched — true by construction, since
 * `POST /admin/products/:id/publish` only ever appends a new snapshot row for this product; it
 * never mutates or removes the one currently live.
 */
export function PublishProductsButton({
  productId,
  onPublished,
}: {
  productId: string;
  onPublished?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function confirmPublish() {
    const result = await run(() => adminApi.post(`/admin/products/${productId}/publish`));
    setConfirming(false);
    if (result.success) {
      showToast("Produk berhasil dipublikasikan.");
      onPublished?.();
    } else {
      showToast("Gagal mempublikasikan produk. Versi sebelumnya masih tayang.", "error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <SaveStateIndicator status={status} error={error} />
      <Button type="button" onClick={() => setConfirming(true)} disabled={status === "saving"}>
        {status === "saving" ? "Publishing..." : "Publish"}
      </Button>
      {confirming && (
        <ConfirmDialog
          title="Publish this product?"
          message="Publishing will make the current draft visible on the public website and available to the AI Assistant after knowledge synchronization."
          confirmLabel="Publish"
          onConfirm={() => void confirmPublish()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
