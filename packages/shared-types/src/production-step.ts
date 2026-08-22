import type { Translations } from "./i18n";
import type { Media } from "./media";

export const PRODUCTION_STEP_ICON_KEYS = [
  "sourcing",
  "warehouse",
  "quality",
  "packaging",
  "logistics",
  "documents",
  "shipping",
] as const;

export type ProductionStepIcon = (typeof PRODUCTION_STEP_ICON_KEYS)[number];

export const PRODUCTION_STEP_ICON_LABELS: Record<ProductionStepIcon, string> = {
  sourcing: "Agriculture / Sourcing",
  warehouse: "Warehouse / Storage",
  quality: "Quality Control",
  packaging: "Packing / Packaging",
  logistics: "Logistics",
  documents: "Documents",
  shipping: "Shipping / Delivery",
};

export interface ProductionStep {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: ProductionStepIcon;
  illustration: Media | null;
  cta_label: string | null;
  cta_href: string | null;
  order: number;
  active: boolean;
  translations?: Translations | null;
}

/** "Our Supply & Export Process" section header + closing CTA (singleton) — editable
 * independently of the individual stages, same shape as HomepagePartnersSection. */
export interface HomepageProcessSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  final_heading: string;
  final_description: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  translations?: Translations | null;
}
