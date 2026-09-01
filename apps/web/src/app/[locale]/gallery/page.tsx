import type { Locale } from "@ppn/shared-types";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery, getGalleryCategories, getPageHeader, getProducts, getPublishedAboutCompany } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { GalleryHero } from "@/components/gallery/GalleryHero";
import { GalleryPageClient } from "@/components/gallery/GalleryPageClient";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  return buildPageMetadata({
    title: dictionary.nav.gallery,
    description: dictionary.gallery.metaDescription,
    path: "/gallery",
    locale,
  });
}

// Gallery — instant-publish module (no Draft/Publish snapshot, see README "Gallery"). Fetches
// categories/items alongside the Products/Team data the "virtual" categories render (read-only,
// never duplicated into GalleryItem rows — brief §29/§30).
export default async function GalleryPage({ params }: PageProps<"/[locale]/gallery">) {
  const { locale } = await params;
  const [categories, items, products, aboutCompany, headerConfig, dictionary] = await Promise.all([
    getGalleryCategories(locale),
    getGallery(undefined, locale),
    getProducts(locale),
    getPublishedAboutCompany(locale),
    getPageHeader("gallery", locale),
    getDictionary(locale as Locale),
  ]);

  return (
    <main>
      <GalleryHero
        locale={locale}
        totalPhotoCount={items.length}
        headerConfig={headerConfig}
        dictionary={dictionary}
      />
      <Suspense fallback={null}>
        <GalleryPageClient
          categories={categories}
          items={items}
          products={products}
          teamMembers={aboutCompany.team_members}
          dictionary={dictionary}
        />
      </Suspense>
    </main>
  );
}
