"use client";

import { useState } from "react";
import { useSaveState } from "./useSaveState";

/**
 * Replaces the `defaultValue` + `onBlur` autosave pattern used throughout the Admin panel.
 * Controlled instead of uncontrolled, so a failed save can revert the field to its last known
 * good value rather than silently leaving the unsaved edit on screen — see README "Homepage
 * Manager", the "failed save still shows the new value" bug this fixes.
 */
export function useAutosaveField<T>(serverValue: T, onSave: (value: T) => Promise<unknown>) {
  const [value, setValue] = useState(serverValue);
  // `committed` is "the value we know is actually persisted" — updated both when the prop
  // changes externally AND after our own successful save. `lastProp` tracks only the prop
  // itself, purely to detect a genuine external change; keeping it separate from `committed`
  // is what stops a successful save's own state update from being mistaken, one render later,
  // for an external change and reverted back to the (now-stale) prop.
  const [committed, setCommitted] = useState(serverValue);
  const [lastProp, setLastProp] = useState(serverValue);
  const { status, error, run } = useSaveState();

  if (serverValue !== lastProp) {
    setLastProp(serverValue);
    setCommitted(serverValue);
    setValue(serverValue);
  }

  async function commit() {
    if (value === committed) return;
    const result = await run(() => onSave(value));
    if (result.success) {
      setCommitted(value);
    } else {
      setValue(committed);
    }
  }

  return { value, onChange: setValue, onBlur: commit, status, error };
}
