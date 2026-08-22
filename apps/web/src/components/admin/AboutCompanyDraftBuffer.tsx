"use client";

import { createContext, useContext, useEffect } from "react";

export interface AboutCompanyDraftBuffer {
  /** True while the editor holds edits that have not reached the draft tables yet. */
  isDirty: boolean;
  /** Persists the buffered edits. Resolves `true` only when the server confirmed the write. */
  save: () => Promise<boolean>;
  /** Throws the buffered edits away and restores the last values loaded from the server. */
  discard: () => void;
}

interface DraftBufferContextValue {
  register: (buffer: AboutCompanyDraftBuffer | null) => void;
}

export const AboutCompanyDraftBufferContext = createContext<DraftBufferContextValue | null>(null);

/**
 * Lets a section editor hand its buffered (not-yet-saved) state to the sticky action bar in
 * `AboutCompanySectionEditorShell`, so that bar's Discard / Save Draft buttons act on real
 * state instead of being decorative.
 *
 * Only editors that actually buffer edits register — most fields in this Admin autosave to the
 * draft tables on blur, and the shell hides the two buttons entirely when nothing is registered
 * rather than showing controls that would do nothing.
 *
 * `save` and `discard` must be referentially stable (wrap them in `useCallback`); this hook
 * re-registers whenever they or `isDirty` change.
 */
export function useRegisterDraftBuffer(buffer: AboutCompanyDraftBuffer) {
  const context = useContext(AboutCompanyDraftBufferContext);
  const register = context?.register;
  const { isDirty, save, discard } = buffer;

  useEffect(() => {
    if (!register) return;
    register({ isDirty, save, discard });
    return () => register(null);
  }, [register, isDirty, save, discard]);
}
