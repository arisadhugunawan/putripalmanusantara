"use client";

import type { ArticleDetail, ArticleSummary } from "@ppn/shared-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { ArticleDetailView } from "@/components/articles/ArticleDetailView";

/**
 * Draft preview — reads the Admin (unpublished-safe) article record directly rather than the
 * public "published only" endpoint, same reasoning as `/admin/preview/homepage`: a Draft must
 * be visible to the person editing it without ever being reachable by a real visitor. Related
 * Articles here are computed from the Admin's own article list (same-category, published)
 * rather than the public `/articles/:slug/related` endpoint, since a Draft has no public slug
 * to query by yet.
 */
export default function ArticlePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [related, setRelated] = useState<ArticleSummary[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const current = await adminApi.get<ArticleDetail>(`/admin/articles/${id}`);
        const all = await adminApi.get<ArticleDetail[]>("/admin/articles");
        const candidates = all.filter(
          (a) => a.id !== current.id && a.status === "published" && a.category?.id === current.category?.id && current.category,
        );
        setArticle(current);
        setRelated(candidates.slice(0, 3));
      } catch {
        setError(true);
      }
    }
    void load();
  }, [id]);

  return (
    <div>
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-100 px-4 py-2 text-small text-amber-900">
        <span>
          <strong>Draft Preview</strong> — menampilkan konten yang belum dipublikasikan. Pengunjung situs tidak melihat ini.
        </span>
        <Link href="/admin/artikel" className="font-medium underline">
          ← Kembali ke Artikel
        </Link>
      </div>

      {error && <p className="p-8 text-center text-body text-red-600">Gagal memuat preview. Silakan coba lagi.</p>}
      {!error && !article && <p className="p-8 text-center text-body text-neutral-500">Memuat preview...</p>}
      {article && <ArticleDetailView article={article} relatedArticles={related} locale="en" />}
    </div>
  );
}
