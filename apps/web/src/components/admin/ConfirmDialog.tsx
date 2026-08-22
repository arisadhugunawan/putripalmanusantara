"use client";

import { useEffect, useRef } from "react";

/**
 * In-page confirmation modal — replaces native `window.confirm()` for destructive actions.
 * `confirm()` depends on the browser's own dialog implementation, which some embedded/webview
 * contexts suppress or auto-dismiss silently (the delete button then looks like it does
 * nothing). A React-rendered dialog has no such dependency and always works the same way.
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // Moves focus into the dialog on open and hands it back to whatever opened it on close, so
  // keyboard users aren't dropped at the top of the page behind the overlay.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onCancel}
    >
      <div className="w-full max-w-sm rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-h3 text-neutral-900">{title}</h3>
        <p className="mt-2 text-body text-neutral-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
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
        </div>
      </div>
    </div>
  );
}
