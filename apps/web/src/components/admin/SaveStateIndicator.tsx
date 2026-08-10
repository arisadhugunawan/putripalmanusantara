"use client";

import type { SaveStatus } from "@/hooks/useSaveState";

/**
 * Explicit Saving/Saved/Save Failed states — never a bare "Running" (see README "Homepage
 * Manager"). Renders nothing when idle so it doesn't clutter a form that hasn't been touched.
 */
export function SaveStateIndicator({ status, error }: { status: SaveStatus; error?: string | null }) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-small text-neutral-500">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-neutral-400" aria-hidden="true" />
        Menyimpan...
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-small text-primary-700">
        <span className="inline-block h-2 w-2 rounded-full bg-primary-600" aria-hidden="true" />
        Tersimpan
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-small text-red-600" role="alert">
      <span aria-hidden="true">⚠</span>
      {error ?? "Gagal menyimpan"}
    </span>
  );
}
