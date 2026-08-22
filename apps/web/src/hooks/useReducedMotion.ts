"use client";

import { useSyncExternalStore } from "react";

/** `useSyncExternalStore` (not a `useEffect` + `setState`) — the React-recommended way to read
 * external browser state that can't be known during SSR and may change while mounted (the OS
 * setting can toggle without a reload). `getServerSnapshot` returning `false` matches the
 * server-rendered markup Next.js sends before hydration. Extracted from `ProcessFlowchart.tsx`
 * so `SupplyNetworkVisual.tsx` can reuse the same pattern instead of duplicating it. */
function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
