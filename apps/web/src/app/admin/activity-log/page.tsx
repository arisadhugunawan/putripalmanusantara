"use client";

import { Card } from "@ppn/ui-components";
import type { PaginationMeta } from "@ppn/shared-types";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { Skeleton } from "@/components/admin/Skeleton";

interface ActivityLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  method: string;
  path: string;
  status_code: number;
  summary: string;
  created_at: string;
}

interface FilterOptions {
  actors: { id: string; name: string }[];
  actions: string[];
  modules: string[];
}

const LIMIT = 25;

const selectClass =
  "rounded-field border border-neutral-200 bg-white px-3 py-2 text-small text-neutral-700";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Read-only trail of who did what across Admin — written automatically by a backend interceptor
 * on every mutating admin request, so this page only needs to display it, never to record it
 * itself. Restricted to super_admin server-side; the sidebar link only appears for that role too. */
export default function AdminActivityLogPage() {
  const [items, setItems] = useState<ActivityLogEntry[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi
      .get<FilterOptions>("/admin/activity-log/filters")
      .then(setFilters)
      .catch(() => setFilters({ actors: [], actions: [], modules: [] }));
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (actorId) params.set("actorId", actorId);
      if (action) params.set("action", action);
      if (module) params.set("module", module);
      const result = await adminApi.getPaginated<ActivityLogEntry[]>(`/admin/activity-log?${params}`);
      setItems(result.data);
      setMeta(result.meta);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [page, actorId, action, module]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-filter-change; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  // A filter change always jumps back to page 1 — a stale page number past the new (smaller)
  // result set would otherwise show an empty table with no way back.
  const [prevFilters, setPrevFilters] = useState({ actorId, action, module });
  if (prevFilters.actorId !== actorId || prevFilters.action !== action || prevFilters.module !== module) {
    setPrevFilters({ actorId, action, module });
    if (page !== 1) setPage(1);
  }

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Activity Log</h1>
      <p className="mt-1 text-body text-neutral-600">
        A record of every action taken by administrators — who did what, to which content, and when.
      </p>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <select value={actorId} onChange={(e) => setActorId(e.target.value)} className={selectClass}>
            <option value="">All admins</option>
            {filters?.actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass}>
            <option value="">All actions</option>
            {filters?.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select value={module} onChange={(e) => setModule(e.target.value)} className={selectClass}>
            <option value="">All modules</option>
            {filters?.modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {status === "error" && <AdminLoadError message="Failed to load the activity log." onRetry={() => void load()} />}

        {status === "loading" && (
          <div className="mt-4 flex flex-col gap-2" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}

        {status === "ready" && items && (
          <>
            {items.length === 0 ? (
              <div className="mt-6 rounded-field border border-dashed border-neutral-300 p-10 text-center">
                <p className="text-body text-neutral-600">No activity matches these filters yet.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-small">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-neutral-500">
                      <th className="whitespace-nowrap py-2 pr-4 font-medium">Time</th>
                      <th className="whitespace-nowrap py-2 pr-4 font-medium">Admin</th>
                      <th className="whitespace-nowrap py-2 pr-4 font-medium">Action</th>
                      <th className="whitespace-nowrap py-2 pr-4 font-medium">Module</th>
                      <th className="whitespace-nowrap py-2 pr-4 font-medium">Entity</th>
                      <th className="whitespace-nowrap py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((entry) => (
                      <tr key={entry.id} className="border-b border-neutral-100 last:border-0">
                        <td className="whitespace-nowrap py-2.5 pr-4 text-neutral-500">{formatTimestamp(entry.created_at)}</td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-neutral-900">
                          {entry.actor_name}
                          <span className="ml-1.5 text-[11px] uppercase text-neutral-400">{entry.actor_role}</span>
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-neutral-700">{entry.action}</td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-neutral-600">{entry.module}</td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-neutral-500">{entry.entity_id ?? "—"}</td>
                        <td className="whitespace-nowrap py-2.5">
                          <span className={entry.status_code >= 400 ? "font-medium text-red-600" : "text-emerald-700"}>
                            {entry.status_code}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {meta && meta.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-small text-neutral-500">
                  {page} / {meta.total_pages} · {meta.total} entries
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={page >= meta.total_pages}
                  className="rounded-field border border-neutral-200 px-3 py-1.5 text-small text-neutral-600 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
