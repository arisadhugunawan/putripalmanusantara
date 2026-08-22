"use client";

import { useRef } from "react";
import { Modal } from "@ppn/ui-components";

/**
 * In-page confirmation modal — replaces native `window.confirm()` for destructive actions.
 * `confirm()` depends on the browser's own dialog implementation, which some embedded/webview
 * contexts suppress or auto-dismiss silently (the delete button then looks like it does
 * nothing). A React-rendered dialog has no such dependency and always works the same way.
 *
 * Built on the shared `Modal` primitive (Phase 5B) — overlay/Escape/focus-restore mechanics are
 * Modal's, this file only supplies the title/message/Cancel-Confirm footer shape. `hideCloseButton`
 * keeps the visible surface identical to before (Cancel/Confirm only, no separate ✕); focus still
 * lands on Cancel, not Confirm, so an accidental Enter press after opening can never trigger the
 * destructive action.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Defaults to "Batal"; set it when the safe choice reads better as something else
   * (e.g. "Stay" in the unsaved-changes prompt). */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      onClose={onCancel}
      title={title}
      maxWidth="sm"
      hideCloseButton
      initialFocusRef={cancelRef}
      footer={
        <>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-button px-4 py-2 text-small font-medium text-neutral-600 hover:bg-neutral-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-button bg-red-600 px-4 py-2 text-small font-medium text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-body text-neutral-600">{message}</p>
    </Modal>
  );
}
