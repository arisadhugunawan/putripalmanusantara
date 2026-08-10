import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { HomepageSectionKey } from "@ppn/shared-types";

export interface SectionRegistryEntry {
  key: HomepageSectionKey;
  label: string;
  description: string;
  /** Rendered lazily (`next/dynamic`) — opening one section never pulls in every other
   * section's editor code/data, per the brief's "don't load all editors at once" rule. */
  editors?: ComponentType[];
  /** Set when this section's *content* is owned by another existing admin module (Facilities,
   * Articles, Gallery, Production Process) — reusing that module's real CRUD rather than
   * building a second, duplicate editor here. Order/visibility on the Homepage is still
   * managed in this Section Manager either way. */
  managedElsewhere?: { label: string; href: string };
  /** True only for the one section with no admin-editable content anywhere in the app yet
   * (Contact CTA is fully static copy) — shown honestly instead of a fake "Manage" link. */
  staticContent?: boolean;
}

// Order here is cosmetic only (used for TypeScript completeness / the registry lookup); the
// actual Homepage order/visibility always comes from `HomepageSectionConfig` at runtime.
export const SECTION_REGISTRY: SectionRegistryEntry[] = [
  {
    key: "hero_slider",
    label: "Hero Slider",
    description: "Banner utama beranda — carousel gambar, CTA, dan overlay teks.",
    editors: [dynamic(() => import("./_editors/HeroSlideEditor").then((m) => m.HeroSlideEditor))],
  },
  {
    key: "partners",
    label: "Partners & Institutions",
    description: "Marquee logo mitra dan institusi pendukung ekspor.",
    editors: [
      dynamic(() => import("./_editors/PartnersSectionEditor").then((m) => m.PartnersSectionEditor)),
      dynamic(() => import("./_editors/PartnerLogoEditor").then((m) => m.PartnerLogoEditor)),
    ],
  },
  {
    key: "about_company",
    label: "About Company",
    description: "Perkenalan perusahaan — teks, video, dan kartu keunggulan.",
    editors: [
      dynamic(() => import("./_editors/AboutPreviewEditor").then((m) => m.AboutPreviewEditor)),
      dynamic(() => import("./_editors/HighlightEditor").then((m) => m.HighlightEditor)),
    ],
  },
  {
    key: "statistics",
    label: "Statistik Perusahaan",
    description: "Angka pencapaian — produk diekspor, kapasitas produksi, dst.",
    editors: [dynamic(() => import("./_editors/StatisticsEditor").then((m) => m.StatisticsEditor))],
  },
  {
    key: "why_choose_us",
    label: "Why Choose Us?",
    description: "Kartu ikon keunggulan PPN.",
    editors: [dynamic(() => import("./_editors/WhyChooseUsEditor").then((m) => m.WhyChooseUsEditor))],
  },
  {
    key: "featured_products",
    label: "Our Products",
    description: "Produk unggulan yang ditampilkan di beranda — memilih dari produk yang sudah ada.",
    editors: [dynamic(() => import("./_editors/FeaturedProductsEditor").then((m) => m.FeaturedProductsEditor))],
  },
  {
    key: "production_process",
    label: "Production Process",
    description: "Tahapan proses produksi.",
    managedElsewhere: { label: "Kelola di Proses Produksi", href: "/admin/proses-produksi" },
  },
  {
    key: "facilities",
    label: "Facilities",
    description: "Fasilitas dan kapasitas produksi.",
    managedElsewhere: { label: "Kelola di Fasilitas", href: "/admin/fasilitas" },
  },
  {
    key: "gallery",
    label: "Gallery",
    description: "Galeri foto fasilitas dan operasional.",
    managedElsewhere: { label: "Kelola di Galeri", href: "/admin/galeri" },
  },
  {
    key: "news_articles",
    label: "News & Articles",
    description: "Artikel terbaru dari blog perusahaan.",
    managedElsewhere: { label: "Kelola di Artikel", href: "/admin/artikel" },
  },
  {
    key: "export_reach",
    label: "Global Export Reach",
    description: "Peta ekspor interaktif dan daftar negara tujuan.",
    editors: [
      dynamic(() => import("./_editors/ExportReachSectionEditor").then((m) => m.ExportReachSectionEditor)),
      dynamic(() => import("./_editors/ExportDestinationEditor").then((m) => m.ExportDestinationEditor)),
    ],
  },
  {
    key: "shipping_partner",
    label: "Global Shipping Partner",
    description: "Carousel logo shipping dan logistics partner.",
    editors: [
      dynamic(() => import("./_editors/ShippingSectionEditor").then((m) => m.ShippingSectionEditor)),
      dynamic(() => import("./_editors/ShippingPartnerEditor").then((m) => m.ShippingPartnerEditor)),
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Pertanyaan yang sering diajukan.",
    editors: [dynamic(() => import("./_editors/FaqEditor").then((m) => m.FaqEditor))],
  },
  {
    key: "contact_cta",
    label: "Contact CTA",
    description: "Ajakan mengisi form permintaan penawaran di penutup beranda.",
    staticContent: true,
  },
];

export function getSectionRegistryEntry(key: string) {
  return SECTION_REGISTRY.find((s) => s.key === key);
}

/** Decorative Graphics isn't a page-position section (it overlays several sections at once,
 * scoped by `page`), so it's deliberately not in `SECTION_REGISTRY`/`HomepageSectionConfig` —
 * kept as its own always-visible entry point instead, same mechanical move as every other
 * editor, just without an order/visibility toggle. */
export const DECORATIVE_GRAPHICS_EDITOR = dynamic(() =>
  import("./_editors/DecorativeGraphicEditor").then((m) => m.DecorativeGraphicEditor),
);
