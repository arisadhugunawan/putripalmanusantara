"use client";

import { Badge } from "@ppn/ui-components";
import type { QuotationRequest, QuotationRequestStatus } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useSaveState } from "@/hooks/useSaveState";

const STATUS_LABEL: Record<QuotationRequestStatus, string> = {
  new: "Baru",
  in_progress: "Diproses",
  done: "Selesai",
};

const STATUS_VARIANT: Record<QuotationRequestStatus, "primary" | "accent" | "neutral"> = {
  new: "primary",
  in_progress: "accent",
  done: "neutral",
};

// FR-CMS-07 — daftar submission, tandai status.
export default function AdminContactsPage() {
  const [items, setItems] = useState<QuotationRequest[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<QuotationRequestStatus | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const query = statusFilter ? `?status=${statusFilter}&limit=50` : "?limit=50";
    const result = await adminApi.getPaginated<QuotationRequest[]>(`/admin/quotation-requests${query}`);
    setItems(result.data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Kontak / Quotation</h1>

      <div className="mt-4 flex gap-2">
        {(["", "new", "in_progress", "done"] as const).map((status) => (
          <button
            key={status || "all"}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-button px-4 py-1.5 text-small font-medium ${
              statusFilter === status ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {status === "" ? "Semua" : STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {items?.map((item) => (
          <QuotationRow
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onStatusChanged={(status) => setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, status } : i)) ?? null)}
          />
        ))}
        {items?.length === 0 && <p className="text-body text-neutral-600">Belum ada submission.</p>}
      </div>
    </div>
  );
}

function QuotationRow({
  item,
  expanded,
  onToggleExpand,
  onStatusChanged,
}: {
  item: QuotationRequest;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChanged: (status: QuotationRequestStatus) => void;
}) {
  const { status, error, run } = useSaveState();

  async function handleStatusChange(next: QuotationRequestStatus) {
    const previous = item.status;
    onStatusChanged(next); // optimistic — this is a simple status label, not critical CMS content
    const result = await run(() => adminApi.put(`/admin/quotation-requests/${item.id}/status`, { status: next }));
    if (!result.success) onStatusChanged(previous);
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-neutral-900">
            {item.name} — {item.company}
          </p>
          <p className="text-small text-neutral-600">
            {item.type === "quotation" ? "Permintaan Quotation" : "Kontak Umum"} · {item.country} ·{" "}
            {new Date(item.created_at).toLocaleDateString("id-ID")}
          </p>
          {item.product_name && <p className="text-small text-neutral-600">Produk: {item.product_name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
          <select
            value={item.status}
            onChange={(e) => void handleStatusChange(e.target.value as QuotationRequestStatus)}
            className="rounded-field border border-neutral-300 px-2 py-1 text-small"
          >
            <option value="new">Baru</option>
            <option value="in_progress">Diproses</option>
            <option value="done">Selesai</option>
          </select>
          <SaveStateIndicator status={status} error={error} />
          <button type="button" onClick={onToggleExpand} className="text-small text-primary-700 underline">
            {expanded ? "Tutup" : "Lihat Pesan"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 border-t border-neutral-200 pt-3 text-body text-neutral-700">
          <p>
            <strong>Email:</strong> {item.email}
          </p>
          {item.phone && (
            <p>
              <strong>Telepon:</strong> {item.phone}
            </p>
          )}
          {item.estimated_quantity && (
            <p>
              <strong>Estimasi Kuantitas:</strong> {item.estimated_quantity}
            </p>
          )}
          <p className="mt-2">{item.message}</p>
        </div>
      )}
    </div>
  );
}
