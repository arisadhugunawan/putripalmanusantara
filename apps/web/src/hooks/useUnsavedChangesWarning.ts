"use client";

import { useEffect } from "react";

/**
 * Covers tab-close/refresh/browser-back reliably via the native `beforeunload` prompt. For
 * in-app navigation (clicking the Section Editor's own "Back" link or another section in the
 * nav), the component doing the navigating intercepts the click and shows `ConfirmDialog`
 * itself — see `SectionEditorShell` — since Next's App Router has no built-in navigation-block
 * API to hook into globally.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
