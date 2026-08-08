"use client";

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
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-h3 text-neutral-900">{title}</h3>
        <p className="mt-2 text-body text-neutral-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-button px-4 py-2 text-small font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Batal
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
