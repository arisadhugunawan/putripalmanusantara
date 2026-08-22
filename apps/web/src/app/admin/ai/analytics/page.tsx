"use client";

import { Card } from "@ppn/ui-components";
import type { AiAnalyticsSummary } from "@ppn/shared-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Every number here is a real, live count from the AI Assistant's own tables — no simulated
 * or placeholder data, same principle as the main Admin Dashboard (see admin/page.tsx). */
export default function AiAnalyticsPage() {
  const [summary, setSummary] = useState<AiAnalyticsSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await adminApi.get<AiAnalyticsSummary>("/admin/ai/analytics");
      setSummary(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  if (status === "error") {
    return <AdminLoadError message="Gagal memuat AI Analytics." onRetry={() => void load()} />;
  }
  if (status === "loading" || !summary) {
    return <p className="text-body text-neutral-600">Memuat...</p>;
  }

  const cards = [
    { label: "Assistant Status", value: summary.assistant_active ? "Active" : "Inactive" },
    { label: "Knowledge Sources", value: summary.knowledge_sources },
    { label: "Indexed Content", value: summary.indexed_content },
    { label: "Last Sync", value: formatDate(summary.last_sync) },
    { label: "Failed Sync", value: summary.failed_sync },
    { label: "Total Conversations", value: summary.total_conversations },
    { label: "WhatsApp Clicks", value: summary.whatsapp_clicks },
    { label: "Quotation Intent", value: summary.quotation_intent },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">AI Analytics</h1>
        <Link href="/admin/ai" className="text-body text-primary-700 underline">
          ← Kembali ke AI Assistant
        </Link>
      </div>
      <p className="mt-2 text-body text-neutral-600">
        Dihitung dari log percakapan &amp; event nyata — tidak ada data pribadi visitor yang
        ditampilkan, hanya jumlah agregat berdasarkan session id sementara.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} hoverable className="h-full">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{card.label}</p>
            <p className="mt-2 text-h2 font-heading font-bold text-neutral-900">{card.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
