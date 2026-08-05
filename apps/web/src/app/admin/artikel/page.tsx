"use client";

import { Badge, Button } from "@ppn/ui-components";
import type { ArticleDetail } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

// FR-CMS-04
export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleDetail[] | null>(null);

  async function load() {
    const data = await adminApi.get<ArticleDetail[]>("/admin/articles");
    setArticles(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus artikel "${title}"?`)) return;
    await adminApi.delete(`/admin/articles/${id}`);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Artikel</h1>
        <Link href="/admin/artikel/baru">
          <Button>Tambah Artikel</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card bg-white shadow-card">
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-small text-neutral-600">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {articles?.map((article) => (
              <tr key={article.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{article.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={article.status === "published" ? "primary" : "neutral"}>
                    {article.status === "published" ? "Diterbitkan" : "Draf"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link href={`/admin/artikel/${article.id}`} className="text-body text-primary-700 underline">
                      Ubah
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(article.id, article.title)}
                      className="text-body text-red-600 underline"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {articles?.length === 0 && <p className="p-6 text-body text-neutral-600">Belum ada artikel.</p>}
      </div>
    </div>
  );
}
