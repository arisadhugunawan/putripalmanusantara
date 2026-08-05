"use client";

import { Card } from "@ppn/ui-components";
import type { ArticleDetail, ProductDetail, QuotationRequest } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

interface Summary {
  newQuotations: number;
  totalArticles: number;
  totalProducts: number;
}

// FR-CMS-02 — dashboard summary: jumlah quotation baru, jumlah artikel, jumlah produk.
export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function load() {
      const [quotations, articles, products] = await Promise.all([
        adminApi.getPaginated<QuotationRequest[]>("/admin/quotation-requests?status=new&limit=1"),
        adminApi.get<ArticleDetail[]>("/admin/articles"),
        adminApi.get<ProductDetail[]>("/admin/products"),
      ]);
      setSummary({
        newQuotations: quotations.meta?.total ?? 0,
        totalArticles: articles.length,
        totalProducts: products.length,
      });
    }
    void load();
  }, []);

  const cards = [
    { label: "Permintaan Quotation Baru", value: summary?.newQuotations, href: "/admin/kontak" },
    { label: "Total Artikel", value: summary?.totalArticles, href: "/admin/artikel" },
    { label: "Total Produk", value: summary?.totalProducts, href: "/admin/produk" },
  ];

  return (
    <div>
      <h1 className="text-h2 text-neutral-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card hoverable>
              <p className="text-small text-neutral-600">{card.label}</p>
              <p className="mt-2 text-h1 font-heading font-bold text-neutral-900">
                {card.value ?? "…"}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
