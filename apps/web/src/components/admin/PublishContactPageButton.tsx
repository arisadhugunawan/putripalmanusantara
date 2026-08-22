"use client";

import { Button } from "@ppn/ui-components";
import { useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useSaveState } from "@/hooks/useSaveState";
import { ConfirmDialog } from "./ConfirmDialog";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useToast } from "./Toast";

/**
 * Publish/Unpublish for the Contact Page CMS — mirrors `PublishAboutCompanyButton.tsx`
 * exactly, plus the Unpublish half this brief explicitly asks for (About Company doesn't have
 * one). A failed Publish/Unpublish leaves the current live state untouched — true by
 * construction, since both actions only ever update the one `ContactPagePublishedSnapshot`
 * singleton row through a single Prisma `update`, never a partial multi-step write.
 */
export function PublishContactPageButton({
  isPublished,
  onChanged,
}: {
  isPublished: boolean;
  onChanged?: () => void;
}) {
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function confirmPublish() {
    const result = await run(() => adminApi.post("/admin/contact-page/publish"));
    setConfirmingPublish(false);
    if (result.success) {
      showToast("Contact page published.");
      onChanged?.();
    } else {
      showToast("Unable to publish. Your published Contact page remains unchanged.", "error");
    }
  }

  async function confirmUnpublish() {
    const result = await run(() => adminApi.post("/admin/contact-page/unpublish"));
    setConfirmingUnpublish(false);
    if (result.success) {
      showToast("Contact page unpublished.");
      onChanged?.();
    } else {
      showToast("Unable to unpublish. The Contact page remains published.", "error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <SaveStateIndicator status={status} error={error} />
      {isPublished ? (
        <Button type="button" variant="secondary" onClick={() => setConfirmingUnpublish(true)} disabled={status === "saving"}>
          Unpublish
        </Button>
      ) : null}
      <Button type="button" onClick={() => setConfirmingPublish(true)} disabled={status === "saving"}>
        {status === "saving" ? "Publishing..." : "Publish"}
      </Button>

      {confirmingPublish && (
        <ConfirmDialog
          title="Publish Contact Page Changes?"
          message="The current draft will become immediately visible to site visitors, replacing whatever is currently published."
          confirmLabel="Publish"
          onConfirm={() => void confirmPublish()}
          onCancel={() => setConfirmingPublish(false)}
        />
      )}
      {confirmingUnpublish && (
        <ConfirmDialog
          title="Unpublish the Contact Page?"
          message="The public /contact page will stop showing live content until you publish again. Your draft is not affected."
          confirmLabel="Unpublish"
          onConfirm={() => void confirmUnpublish()}
          onCancel={() => setConfirmingUnpublish(false)}
        />
      )}
    </div>
  );
}
