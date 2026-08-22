import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery, getGalleryCategories, getPageHeader, getProducts, getPublishedAboutCompany } from "@/lib/api";
import { GalleryHero } from "@/components/gallery/GalleryHero";
import { GalleryPageClient } from "@/components/gallery/GalleryPageClient";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Gallery",
    description: "Real photos and videos from PPN's warehouse, sorting, loading, and shipments.",
    path: "/gallery",
    locale,
  });
}

// Gallery — instant-publish module (no Draft/Publish snapshot, see README "Gallery"). Fetches
// categories/items alongside the Products/Team data the "virtual" categories render (read-only,
// never duplicated into GalleryItem rows — brief §29/§30).
export default async function GalleryPage({ params }: PageProps<"/[locale]/gallery">) {
  const { locale } = await params;
  const [categories, items, products, aboutCompany, headerConfig] = await Promise.all([
    getGalleryCategories(locale),
    getGallery(undefined, locale),
    getProducts(locale),
    getPublishedAboutCompany(locale),
    getPageHeader("gallery", locale),
  ]);

  return (
    <main>
      <GalleryHero locale={locale} totalPhotoCount={items.length} headerConfig={headerConfig} />
      <Suspense fallback={null}>
        <GalleryPageClient
          categories={categories}
          items={items}
          products={products}
          teamMembers={aboutCompany.team_members}
        />
      </Suspense>
    </main>
  );
}
