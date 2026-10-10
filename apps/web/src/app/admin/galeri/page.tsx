"use client";

import { Card, buttonVariants } from "@ppn/ui-components";
import type { GalleryCategory, GalleryItem } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

interface Summary {
  totalImages: number;
  totalVideos: number;
  totalCategories: number;
  totalFeatured: number;
}

// Gallery Manager overview — stat tiles + quick actions into Category Management and the
// Media Library (this module is instant-publish, no Draft/Publish snapshot — see README
// "Gallery" for why: writes go live immediately, `active` is the hide-without-deleting switch).
export default function AdminGalleryPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function load() {
      const [items, categories] = await Promise.all([
        adminApi.get<GalleryItem[]>("/admin/gallery"),
        adminApi.get<GalleryCategory[]>("/admin/gallery/categories"),
      ]);
      setSummary({
        totalImages: items.filter((item) => item.media_type === "image").length,
        totalVideos: items.filter((item) => item.media_type !== "image").length,
        totalCategories: categories.length,
        totalFeatured: items.filter((item) => item.featured).length,
      });
    }
    void load();
  }, []);

  const cards = [
    { label: "Total Gambar", value: summary?.totalImages },
    { label: "Total Video", value: summary?.totalVideos },
    { label: "Total Kategori", value: summary?.totalCategories },
    { label: "Item Unggulan (Featured)", value: summary?.totalFeatured },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2 text-neutral-900">Galeri</h1>
        <a href="/gallery" target="_blank" rel="noreferrer" className={buttonVariants("ghost", "sm")}>
          Lihat Situs Langsung ↗
        </a>
      </div>
      <p className="mt-1 text-body text-neutral-600">
        Kelola foto, video, dan kategori yang tampil di halaman Galeri publik.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-small text-neutral-600">{card.label}</p>
            <p className="mt-2 text-h1 font-heading font-bold text-neutral-900">{card.value ?? "…"}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/admin/galeri/media">
          <Card hoverable>
            <p className="text-h3 text-neutral-900">Pustaka Media</p>
            <p className="mt-1 text-small text-neutral-600">
              Unggah foto/video, tambah tautan YouTube/TikTok, atur unggulan, dan urutkan item.
            </p>
          </Card>
        </Link>
        <Link href="/admin/galeri/kategori">
          <Card hoverable>
            <p className="text-h3 text-neutral-900">Kelola Kategori</p>
            <p className="mt-1 text-small text-neutral-600">
              Tambah, ubah urutan, atau nonaktifkan kategori galeri (mis. Warehouse, Loading, Drone).
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
