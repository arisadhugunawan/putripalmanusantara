import type { Translations } from "./i18n";

/** Only "active_destination" is highlighted on the public map/list — the other three are
 * admin-side bookkeeping states (a market PPN used to serve, is evaluating, or has paused),
 * kept in Admin but never implied to visitors as a current, active relationship. */
export type ExportStatus =
  | "active_destination"
  | "previous_destination"
  | "potential_market"
  | "inactive";

/** Minimal product reference shown in a destination's info panel — not a duplicate of
 * ProductSummary, just enough to link/label it. */
export interface ExportDestinationProduct {
  id: string;
  slug: string;
  name: string;
}

/** One country on the "Global Export Reach" map (Post-Launch). `enabled` keeps the record
 * on file/editable in Admin; only `enabled` + `export_status === "active_destination"`
 * records are ever sent to the public endpoint. `featured` only affects emphasis in the
 * destination chip list, it is not a visibility gate. */
export interface ExportDestination {
  id: string;
  country_code: string;
  country_code_alpha3: string;
  country_name: string;
  export_status: ExportStatus;
  description: string | null;
  export_volume: string | null;
  export_frequency: string | null;
  destination_port: string | null;
  products: ExportDestinationProduct[];
  order: number;
  enabled: boolean;
  featured: boolean;
  updated_at: string;
  /** Admin-only — present so the CMS can populate LocaleTabs. */
  translations?: Translations | null;
}

/** Singleton — the "Global Export Reach" section's own heading/subtitle, editable
 * independently of the individual destination records (same pattern as
 * HomepagePartnersSection). */
export interface HomepageExportReach {
  id: string;
  heading: string;
  subtitle: string;
  enabled: boolean;
  translations?: Translations | null;
}
