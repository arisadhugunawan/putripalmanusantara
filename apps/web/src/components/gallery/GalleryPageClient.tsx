"use client";

import type { GalleryCategory, GalleryItem, ProductSummary, TeamMember } from "@ppn/shared-types";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { GalleryCategoryFilter } from "./GalleryCategoryFilter";
import { GalleryCategoryEmptyState, GalleryEmptyState } from "./GalleryEmptyState";
import { GalleryFeaturedSection } from "./GalleryFeaturedSection";
import { GalleryJourneySection, type JourneyPanel } from "./GalleryJourneySection";
import { GalleryLightbox } from "./GalleryLightbox";
import { GalleryMasonryGrid } from "./GalleryMasonryGrid";
import { GalleryProductCategoryPanel } from "./GalleryProductCategoryPanel";
import { GalleryTeamCategoryPanel } from "./GalleryTeamCategoryPanel";

const PRODUCTS_SLUG = "products";
const TEAM_SLUG = "team";

/**
 * Client-side category filter + state orchestration (page itself stays a plain server
 * component/SSG). Composes the journey section, featured showcase, filter + masonry grid, and
 * the two "virtual" category panels (Products/Team — real data from those modules, never
 * duplicated into GalleryItem rows, per brief §29/§30).
 */
export function GalleryPageClient({
  categories,
  items,
  products,
  teamMembers,
}: {
  categories: GalleryCategory[];
  items: GalleryItem[];
  products: ProductSummary[];
  teamMembers: TeamMember[];
}) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [lightbox, setLightbox] = useState<{ source: "grid" | "featured"; index: number } | null>(null);
  const gridAnchorRef = useRef<HTMLDivElement>(null);

  const activeMembers = useMemo(() => teamMembers.filter((m) => m.active), [teamMembers]);
  const featuredItems = useMemo(() => items.filter((item) => item.featured), [items]);

  const journeyPanels = useMemo<JourneyPanel[]>(() => {
    return categories.map((category) => {
      if (category.slug === PRODUCTS_SLUG) {
        return {
          id: category.slug,
          name: category.name,
          description: "Every product we export, ready for your order.",
          previewImage: products[0]?.cover_image ?? null,
          itemCount: products.length,
        };
      }
      if (category.slug === TEAM_SLUG) {
        return {
          id: category.slug,
          name: category.name,
          description: "The people behind every shipment.",
          previewImage: activeMembers[0]?.photo ?? null,
          itemCount: activeMembers.length,
        };
      }
      const categoryItems = items.filter((item) => item.category.id === category.id);
      return {
        id: category.slug,
        name: category.name,
        previewImage: categoryItems[0]?.media ?? null,
        itemCount: categoryItems.length,
      };
    });
  }, [categories, items, products, activeMembers]);

  const totalRealItems = items.length;
  const hasAnyContent = totalRealItems > 0 || products.length > 0 || activeMembers.length > 0;

  function handleViewCategory(slug: string) {
    setActiveCategory(slug);
    gridAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    if (activeCategory === PRODUCTS_SLUG || activeCategory === TEAM_SLUG) return [];
    return items.filter((item) => item.category.slug === activeCategory);
  }, [items, activeCategory]);

  if (!hasAnyContent) return <GalleryEmptyState />;

  return (
    <div>
      <GalleryJourneySection panels={journeyPanels} onViewCategory={handleViewCategory} />

      <GalleryFeaturedSection
        items={featuredItems}
        onOpen={(item) => setLightbox({ source: "featured", index: featuredItems.findIndex((i) => i.id === item.id) })}
      />

      <div ref={gridAnchorRef} className="scroll-mt-24 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GalleryCategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />

          <div className="mt-8">
            {activeCategory === PRODUCTS_SLUG ? (
              <GalleryProductCategoryPanel products={products} />
            ) : activeCategory === TEAM_SLUG ? (
              <GalleryTeamCategoryPanel members={activeMembers} />
            ) : filteredItems.length === 0 ? (
              <GalleryCategoryEmptyState
                categoryName={
                  activeCategory === "all" ? "gallery" : (categories.find((c) => c.slug === activeCategory)?.name ?? "gallery")
                }
              />
            ) : (
              <GalleryMasonryGrid
                items={filteredItems}
                onOpen={(index) => setLightbox({ source: "grid", index })}
              />
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <GalleryLightbox
          images={(lightbox.source === "grid" ? filteredItems : featuredItems).map((item) => ({
            id: item.id,
            media: item.media,
            media_type: item.media_type,
            external_url: item.external_url,
            title: item.title,
            caption: item.caption,
            category: item.category.name,
            alt_text: item.alt_text,
          }))}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          fallbackAlt="PPN gallery photo"
        />
      )}
    </div>
  );
}
