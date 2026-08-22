"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LoadStatus = "loading" | "ready" | "error";

/**
 * Fetch-on-mount with explicit `loading` / `ready` / `error` states and a working retry —
 * replaces the bare `void load()` effect the Admin editors used to run, which left a failed
 * fetch as an unhandled rejection and the editor stuck on a "Memuat..." line forever (README
 * "About Company Manager": no blank layouts while loading, no silent load failures).
 *
 * `reload()` refetches without dropping back to the skeleton, so the post-mutation refresh
 * every editor does doesn't make the whole form flash.
 */
export function useAdminResource<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Refetch in place — keeps the current data on screen, and surfaces failures as `error`. */
  const reload = useCallback(async () => {
    try {
      const value = await fetcherRef.current();
      if (!mountedRef.current) return;
      setData(value);
      setStatus("ready");
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
    }
  }, []);

  /** Retry after a failure — shows the skeleton again while the request is in flight. */
  const retry = useCallback(async () => {
    setStatus("loading");
    await reload();
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, status, reload, retry, setData };
}
