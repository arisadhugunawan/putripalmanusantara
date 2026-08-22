"use client";

import { Button } from "@ppn/ui-components";

/**
 * Shown when Admin content could not be fetched — an explicit failure with a working retry,
 * never an empty card that looks like "no data yet" (README "About Company Manager"). The
 * message is deliberately generic: raw server errors are never surfaced to Admin users.
 */
export function AdminLoadError({
  message = "Failed to load About Company content.",
  onRetry,
  retrying = false,
}: {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <p className="text-body text-red-800">{message}</p>
      <Button type="button" variant="secondary" className="mt-4" onClick={onRetry} disabled={retrying}>
        {retrying ? "Mencoba lagi..." : "Try Again"}
      </Button>
    </div>
  );
}
