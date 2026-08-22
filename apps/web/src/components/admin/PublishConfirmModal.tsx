"use client";

import { Button } from "@ppn/ui-components";
import { useEffect, useRef, useState } from "react";

type InstagramStatus = "posted" | "instagram_only" | "no_link";

/** Brief §18 — publish confirmation with the Website/Instagram status radio. The radio is
 * confirmatory context only (it mirrors the Content Source / Instagram URL already set on the
 * main form) rather than a separate persisted field — there is nothing left to store that
 * those fields don't already capture, so picking an option here doesn't change any data; it
 * just makes the admin confirm they've reviewed the Instagram status before publishing. */
export function PublishConfirmModal({
  defaultInstagramStatus,
  onConfirm,
  onCancel,
  confirming,
}: {
  defaultInstagramStatus: InstagramStatus;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}) {
  const [status, setStatus] = useState<InstagramStatus>(defaultInstagramStatus);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publish this content?"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onCancel}
    >
      <div className="w-full max-w-sm rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-h3 text-neutral-900">Publish this content?</h3>

        <div className="mt-4">
          <p className="text-small font-semibold text-neutral-700">Website:</p>
          <p className="text-body text-neutral-600">✓ Publish</p>
        </div>

        <div className="mt-4">
          <p className="text-small font-semibold text-neutral-700">Instagram:</p>
          <div className="mt-1 flex flex-col gap-2">
            {(
              [
                { value: "posted", label: "Already posted" },
                { value: "instagram_only", label: "Instagram only" },
                { value: "no_link", label: "No Instagram link" },
              ] as { value: InstagramStatus; label: string }[]
            ).map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-body text-neutral-700">
                <input
                  type="radio"
                  name="instagram-status"
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-button px-4 py-2 text-small font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <Button type="button" onClick={onConfirm} disabled={confirming}>
            {confirming ? "Publishing..." : "Confirm Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
