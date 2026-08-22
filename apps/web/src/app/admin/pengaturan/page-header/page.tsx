"use client";

import { Badge, Card } from "@ppn/ui-components";
import { GLOBAL_DEFAULT_PAGE_HEADER_KEY, type PageHeader } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { PAGE_HEADER_ORDER, pageHeaderLabel } from "./page-header-labels";

export default function PageHeaderListPage() {
  const [rows, setRows] = useState<PageHeader[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    setStatus("loading");
    try {
      const data = await adminApi.get<PageHeader[]>("/admin/page-headers");
      setRows(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  if (status === "error") {
    return <AdminLoadError message="Gagal memuat Inner Page Header." onRetry={() => void load()} />;
  }

  const byKey = new Map((rows ?? []).map((row) => [row.page_key, row]));
  const globalRow = byKey.get(GLOBAL_DEFAULT_PAGE_HEADER_KEY);

  return (
    <div>
      <Link href="/admin/pengaturan" className="text-small text-neutral-600 underline underline-offset-2">
        ← Kembali ke Pengaturan
      </Link>
      <h1 className="mt-2 text-h2 text-neutral-900">Inner Page Header</h1>
      <p className="mt-2 max-w-2xl text-body text-neutral-600">
        Atur background, judul, subtitle, overlay, dan warna untuk header setiap halaman —
        tanpa perlu coding. Sebuah halaman yang belum memiliki konfigurasi sendiri akan
        menggunakan Global Default Header di bawah.
      </p>

      {status === "loading" && <p className="mt-6 text-small text-neutral-500">Memuat...</p>}

      {status === "ready" && (
        <div className="mt-6 flex flex-col gap-6 pb-10">
          {globalRow && (
            <Card>
              <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
                Fallback
              </p>
              <PageHeaderRow row={globalRow} />
            </Card>
          )}

          <Card>
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
              Page Header Management
            </p>
            <div className="mt-3 flex flex-col divide-y divide-neutral-100">
              {PAGE_HEADER_ORDER.map((key) => {
                const row = byKey.get(key);
                if (!row) return null;
                return <PageHeaderRow key={key} row={row} />;
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function PageHeaderRow({ row }: { row: PageHeader }) {
  const configured = Boolean(row.background_image || row.custom_title || row.subtitle);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-body font-medium text-neutral-900">{pageHeaderLabel(row.page_key)}</span>
        {row.page_key !== GLOBAL_DEFAULT_PAGE_HEADER_KEY && (
          <Badge variant={row.is_active ? "primary" : "neutral"}>
            {row.is_active ? "✓ Active" : "Inactive"}
          </Badge>
        )}
        {!configured && <span className="text-small text-neutral-400">Belum dikonfigurasi</span>}
      </div>
      <Link
        href={`/admin/pengaturan/page-header/${row.page_key}`}
        className="text-small font-medium text-primary-700 underline underline-offset-2"
      >
        Edit
      </Link>
    </div>
  );
}
