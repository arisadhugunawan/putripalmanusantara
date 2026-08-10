"use client";

import { useCallback, useRef, useState } from "react";
import { ApiRequestError } from "@/lib/admin/client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVED_RESET_MS = 2500;

/**
 * Reusable "Saving.../Saved/Save Failed" state machine — the status only ever changes in
 * response to the actual server response, never optimistically ahead of it (see README
 * "Homepage Manager" — Rule 2/3: only a successful server response may show as saved, and a
 * failed request must never look like success). Guards against double-submit: a second `run()`
 * call while already `"saving"` is ignored rather than firing a second request.
 */
export function useSaveState() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<{ success: true; value: T } | { success: false }> => {
      if (savingRef.current) return { success: false };
      savingRef.current = true;
      if (resetTimer.current) clearTimeout(resetTimer.current);
      setStatus("saving");
      setError(null);
      try {
        const value = await fn();
        setStatus("saved");
        resetTimer.current = setTimeout(() => setStatus("idle"), SAVED_RESET_MS);
        return { success: true, value };
      } catch (err) {
        setStatus("error");
        setError(err instanceof ApiRequestError ? err.message : "Terjadi kesalahan. Silakan coba lagi.");
        return { success: false };
      } finally {
        savingRef.current = false;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, run, reset };
}
