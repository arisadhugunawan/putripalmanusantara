import type { Translations } from "./i18n";
import type { Media } from "./media";

export const SUPPLY_NETWORK_ICON_KEYS = [
  "farmer",
  "collector",
  "supplier",
  "warehouse",
  "quality_control",
  "packing",
  "loading",
  "container",
  "shipping",
  "global_buyer",
] as const;

export type SupplyNetworkIcon = (typeof SUPPLY_NETWORK_ICON_KEYS)[number];

export const SUPPLY_NETWORK_ICON_LABELS: Record<SupplyNetworkIcon, string> = {
  farmer: "Farmer / Agriculture",
  collector: "Collector / Basket",
  supplier: "Supplier Network",
  warehouse: "Warehouse",
  quality_control: "Quality Control / Inspection",
  packing: "Packing / Box",
  loading: "Loading / Forklift",
  container: "Shipping Container",
  shipping: "Cargo Ship",
  global_buyer: "Global Buyer / Globe",
};

export const SUPPLY_NETWORK_POSITIONS = [
  "top",
  "top_right",
  "right",
  "bottom_right",
  "bottom",
  "bottom_left",
  "left",
  "top_left",
] as const;

export type SupplyNetworkPosition = (typeof SUPPLY_NETWORK_POSITIONS)[number];

export const SUPPLY_NETWORK_POSITION_LABELS: Record<SupplyNetworkPosition, string> = {
  top: "Top",
  top_right: "Top Right",
  right: "Right",
  bottom_right: "Bottom Right",
  bottom: "Bottom",
  bottom_left: "Bottom Left",
  left: "Left",
  top_left: "Top Left",
};

export interface SupplyNetworkItem {
  id: string;
  label: string;
  title: string;
  /** Small headline shown in the node's click/hover info panel — e.g. node "Farmers" →
   * short_title "Local Farmer Network". */
  short_title: string;
  description: string;
  icon: SupplyNetworkIcon;
  illustration: Media | null;
  cta_label: string | null;
  cta_href: string | null;
  position: SupplyNetworkPosition;
  order: number;
  active: boolean;
  translations?: Translations | null;
}

/** Admin-manageable "From Node → To Node" link the visual draws as an animated curved
 * connection path. */
export interface SupplyNetworkConnection {
  id: string;
  from_node_id: string;
  to_node_id: string;
  order: number;
}

/** A destination marker for the section's subtle background "global trade" motif — never a
 * real GIS map, just a name + flag + short status label. */
export interface SupplyNetworkCountry {
  id: string;
  name: string;
  flag_emoji: string;
  status: string;
  order: number;
  active: boolean;
  translations?: Translations | null;
}

/** "Our Supply Network" section header + closing CTA (singleton) — editable independently of
 * the individual network items, same shape as HomepageProcessSection. Extended with the center
 * node's own copy and the animation feature toggles (all default on). */
export interface HomepageSupplyNetworkSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  center_label: string;
  center_title: string;
  center_description: string;
  final_heading: string;
  final_description: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  enable_animation: boolean;
  auto_rotate: boolean;
  particle_flow: boolean;
  hover_effect: boolean;
  effect_3d: boolean;
  translations?: Translations | null;
}
