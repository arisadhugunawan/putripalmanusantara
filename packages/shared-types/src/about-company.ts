import type { ExportDestination } from "./export-destination";
import type { Facility } from "./facility";
import type { Media } from "./media";

export const ABOUT_COMPANY_SECTION_KEYS = [
  "company",
  "team",
  "what_we_do",
  "legal_certificate",
  "factory",
  "facilities",
  "moq_payment_terms",
  "shipment_terms",
  "facilities_faq",
] as const;

export type AboutCompanySectionKey = (typeof ABOUT_COMPANY_SECTION_KEYS)[number];

export interface AboutCompanySectionConfig {
  id: string;
  key: AboutCompanySectionKey;
  order: number;
  visible: boolean;
  updated_at: string;
  /** True when this section's draft tables changed after the last Publish — drives the
   * Published/Draft badge in the Admin overview. Always `false` on data read back out of a
   * published snapshot. */
  has_unpublished_changes: boolean;
}

/** Explicit Admin status for one section — never a vague "Loading"/"Processing". */
export type AboutCompanySectionStatus = "published" | "draft" | "hidden";

export function resolveAboutCompanySectionStatus(
  config: Pick<AboutCompanySectionConfig, "visible" | "has_unpublished_changes">,
  lastPublishedAt: string | null,
): AboutCompanySectionStatus {
  if (!config.visible) return "hidden";
  if (!lastPublishedAt || config.has_unpublished_changes) return "draft";
  return "published";
}

export const ABOUT_COMPANY_SECTION_STATUS_LABELS: Record<AboutCompanySectionStatus, string> = {
  published: "Published",
  draft: "Draft",
  hidden: "Hidden",
};

export interface AboutCompanyPublishStatus {
  last_published_at: string | null;
  has_unpublished_changes: boolean;
}

export interface AboutCompanySnapshotSummary {
  id: string;
  published_at: string;
}

export interface AboutCompanyGalleryImage {
  id: string;
  media: Media;
  caption: string | null;
  alt_text: string | null;
  order: number;
  featured: boolean;
}

/** One Company Facts row — a label/value pair the Admin fully controls. */
export interface AboutCompanyFact {
  id: string;
  label: string;
  value: string;
  /** Icon key from `ABOUT_COMPANY_FACT_ICONS`; anything else renders without an icon. */
  icon: string | null;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Icon keys the public Company Facts grid knows how to draw. Kept as a fixed allowlist so
 * Admin input can never inject markup or point at an arbitrary remote asset. */
export const ABOUT_COMPANY_FACT_ICONS = [
  "building",
  "location",
  "leaf",
  "package",
  "globe",
  "ship",
  "phone",
  "calendar",
] as const;

export type AboutCompanyFactIcon = (typeof ABOUT_COMPANY_FACT_ICONS)[number];

/** Section 01 — "CV. Putri Palma Nusantara" (singleton). Beyond the original profile fields
 * this carries the copy for each storytelling block of the company-profile redesign; the
 * repeatable content each block renders lives in its own existing collection (facts, What We
 * Do items, export destinations), never duplicated here. */
export interface AboutCompanyProfile {
  id: string;
  headline: string;
  short_description: string;
  main_description: string;
  vision: string;
  mission: string;
  company_overview: string;
  main_image: Media | null;
  gallery: AboutCompanyGalleryImage[];

  /** 01 Introduction / "Who We Are". */
  eyebrow: string;
  subheading: string;
  cta_label: string | null;
  cta_href: string | null;
  /** Any supported YouTube URL format — the video ID is extracted on the frontend. */
  youtube_video_url: string | null;
  /** "Connect With PPN" social row, shown under the video; rows live in `social_links`. */
  social_label: string;
  social_visible: boolean;

  /** 02 Company Story. */
  story_label: string;
  story_heading: string;
  story_description: string;
  story_secondary_description: string;
  story_image: Media | null;
  story_visible: boolean;

  /** 03 Business Scope — copy only; the items come from `what_we_do_items`. */
  scope_label: string;
  scope_heading: string;
  scope_description: string;
  scope_visible: boolean;

  /** 05 Company Facts — copy only; the rows come from `facts`. */
  facts_label: string;
  facts_heading: string;
  facts_visible: boolean;

  /** 06/07 Global Export Reach — copy only; the countries come from `export_destinations`. */
  export_label: string;
  export_heading: string;
  export_description: string;
  export_visible: boolean;

  /** 08 Legal / company information. Blank values are not rendered publicly. */
  legal_label: string;
  legal_heading: string;
  business_type: string;
  registered_address: string;
  business_id_number: string;
  established_year: string;
  legal_visible: boolean;

  /** 09 Closing statement. */
  closing_label: string;
  closing_heading: string;
  closing_description: string;
  closing_cta_label: string | null;
  closing_cta_href: string | null;
  closing_visible: boolean;

  translations?: Record<string, Record<string, string>> | null;
}

/** One row of the "Connect With PPN" social link list — an open CRUD list (not a fixed set of
 * platform slots), so a platform this brief didn't anticipate never needs a schema change. */
export interface AboutCompanySocialLink {
  id: string;
  /** Free-text key used to pick an icon on the frontend, e.g. "instagram", "tiktok",
   * "facebook", "linkedin", "youtube", "whatsapp", "twitter", "other". */
  platform: string;
  display_name: string;
  url: string;
  active: boolean;
  open_in_new_tab: boolean;
  order: number;
  updated_at: string;
}

/** Section 02 — "PPN Team". Optional contact fields are only ever rendered when filled. */
export interface TeamMember {
  id: string;
  name: string;
  position: string;
  biography: string;
  /** Free text; newline-separated lines render as bullets in the public profile modal. */
  responsibilities: string;
  /** Optional grouping label ("Operations", "Management", …). Hidden when empty. */
  department: string | null;
  photo: Media | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  order: number;
  active: boolean;
  featured: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Section 02's own heading copy (singleton). */
export interface AboutCompanyTeamSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  cta_label: string | null;
  cta_href: string | null;
  /** When true the public section shows a count derived from the published members. */
  show_counter: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Alt text for a team portrait: the Admin's own alt text when set, otherwise a description
 * built from the member's real name and position — never a filename. */
export function teamMemberPhotoAlt(
  member: Pick<TeamMember, "name" | "position" | "photo">,
  companyName = "CV. Putri Palma Nusantara",
): string {
  const provided = member.photo?.alt_text?.trim();
  if (provided) return provided;
  return `${member.name} — ${member.position}, ${companyName}`;
}

/** Section 03 — "What We Supply" (product key: "what_we_do", unchanged — see
 * `AboutCompanyWhatWeDoSection`). */
export interface WhatWeDoItem {
  id: string;
  title: string;
  short_description: string;
  detailed_description: string;
  /** Short bullet points shown under the description (e.g. "Export-oriented fresh coconut"). */
  key_points: string[];
  media: Media | null;
  /** Optional link to a real catalogue product. The href is built from the product's current
   * slug at render time, so it can never point at a renamed or deleted product. `cover_image`
   * is the product's own current cover photo — showing it here (rather than a separate upload)
   * means editing a product's photo in Products automatically updates this card too. */
  product: { id: string; slug: string; name: string; cover_image: Media | null } | null;
  order: number;
  active: boolean;
  featured: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Section-level copy for "What We Supply" — also carries the "Who We Supply" sub-block's
 * heading/description and the Buyer/Supplier CTA copy, since both live inside this same
 * section's component rather than becoming separate top-level sections (singleton). */
export interface AboutCompanyWhatWeDoSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  who_heading: string;
  who_description: string;
  buyer_cta_heading: string;
  buyer_cta_description: string;
  buyer_cta_button_text: string;
  supplier_cta_heading: string;
  supplier_cta_description: string;
  supplier_cta_button_text: string;
  translations?: Record<string, Record<string, string>> | null;
}

/** "Who We Supply" audience segment (Importers/Manufacturers/Distributors/Industrial Users/
 * Long-term Partners) — a flat repeatable list. */
export interface WhoWeSupplyItem {
  id: string;
  title: string;
  description: string;
  /** Icon key from `WHO_WE_SUPPLY_ICONS`; anything else renders without an icon. */
  icon: string | null;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Icon keys the public "Who We Supply" segments know how to draw — a fixed allowlist so Admin
 * input can never inject markup or point at an arbitrary remote asset. */
export const WHO_WE_SUPPLY_ICONS = [
  "globe",
  "factory",
  "truck",
  "building",
  "handshake",
] as const;

export type WhoWeSupplyIcon = (typeof WHO_WE_SUPPLY_ICONS)[number];

export type LegalDocumentType =
  | "certificate"
  | "legal_document"
  | "business_license"
  | "registration_document"
  | "export_certificate"
  | "quality_certificate"
  | "other";

export const LEGAL_DOCUMENT_TYPES: LegalDocumentType[] = [
  "certificate",
  "legal_document",
  "business_license",
  "registration_document",
  "export_certificate",
  "quality_certificate",
  "other",
];

export const LEGAL_DOCUMENT_TYPE_LABELS: Record<LegalDocumentType, string> = {
  certificate: "Certificate",
  legal_document: "Legal Document",
  business_license: "Business License",
  registration_document: "Registration Document",
  export_certificate: "Export Certificate",
  quality_certificate: "Quality Certificate",
  other: "Other",
};

/** Admin-managed document category (replaces the fixed `LegalDocumentType` enum). */
export interface LegalDocumentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Section 04 — "Legal & Company Information". `file` may be a PDF or an image Media row. */
export interface LegalCertificateDocument {
  id: string;
  title: string;
  /** Legacy enum, retained so documents created before categories existed still resolve. */
  document_type: LegalDocumentType;
  category: LegalDocumentCategory | null;
  document_number: string | null;
  issuing_organization: string | null;
  country: string | null;
  /** True only because an Admin ticked it — never inferred from the file. */
  verified: boolean;
  issue_date: string | null;
  expiry_date: string | null;
  description: string | null;
  file: Media | null;
  preview_image: Media | null;
  order: number;
  active: boolean;
  featured: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Section 04's heading copy plus its one behavioural setting. */
export interface AboutCompanyLegalSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  hide_expired: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** A document's category label, falling back to the legacy enum for older records.
 * `typeLabels` defaults to the English `LEGAL_DOCUMENT_TYPE_LABELS` map so existing callers
 * (e.g. the Indonesian-only admin) keep working unchanged; the public, locale-aware About
 * Company page passes its own dictionary-sourced map instead. */
export function legalDocumentCategoryLabel(
  doc: LegalCertificateDocument,
  typeLabels: Record<LegalDocumentType, string> = LEGAL_DOCUMENT_TYPE_LABELS,
): string {
  return doc.category?.name ?? typeLabels[doc.document_type];
}

/** True when the document carries an expiry date that is already in the past. */
export function isLegalDocumentExpired(doc: LegalCertificateDocument, now = new Date()): boolean {
  if (!doc.expiry_date) return false;
  const expiry = new Date(doc.expiry_date);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < now.getTime();
}

export interface FactoryGalleryImage {
  id: string;
  media: Media;
  title: string | null;
  caption: string | null;
  category: string | null;
  alt_text: string | null;
  order: number;
  featured: boolean;
  active: boolean;
}

export interface FactoryDocument {
  id: string;
  title: string;
  file: Media | null;
  description: string | null;
  order: number;
  active: boolean;
}

/** A TikTok video for the Factory section's video showcase. `tiktok_url` is the only input the
 * Admin ever provides — the official TikTok embed script renders the video client-side from it,
 * so there is no separate thumbnail/video file to manage. */
export interface FactoryVideo {
  id: string;
  title: string;
  tiktok_url: string;
  description: string | null;
  order: number;
  featured: boolean;
  active: boolean;
}

/** Section 05 — "Factory" (singleton, distinct from the separate Facilities module). */
export interface FactoryProfile {
  id: string;
  eyebrow: string;
  name: string;
  short_description: string;
  detailed_description: string;
  location: string | null;
  operational_info: string | null;
  capacity: string | null;
  additional_notes: string | null;
  gallery: FactoryGalleryImage[];
  documents: FactoryDocument[];
  videos: FactoryVideo[];
  translations?: Record<string, Record<string, string>> | null;
}

/** Section 06 "Facilities" — heading copy + auto-rotation settings (singleton). The facility
 * list itself lives in `PublishedAboutCompanyPayload.facilities`, not here. */
export interface AboutCompanyFacilitiesSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  auto_rotate: boolean;
  /** Clamped 5–7 by the admin DTO/UI, per the brief's auto-rotation spec. */
  rotate_interval_seconds: number;
  translations?: Record<string, Record<string, string>> | null;
}

export const MOQ_PAYMENT_QUICK_CARD_ICON_KEYS = ["container", "payment", "shipping", "currency"] as const;
export type MoqPaymentQuickCardIcon = (typeof MOQ_PAYMENT_QUICK_CARD_ICON_KEYS)[number];
export const MOQ_PAYMENT_QUICK_CARD_ICON_LABELS: Record<MoqPaymentQuickCardIcon, string> = {
  container: "Container / Box",
  payment: "Payment / Card",
  shipping: "Shipping / Vessel",
  currency: "Currency",
};

/** Section 07 "Facilities → MOQ & Payment Terms" — ordering/payment intro + Supply Capacity
 * panel + Commitment statement + closing CTA copy (singleton). The two lists (Quick Overview
 * Cards, Business Terms) live in `PublishedAboutCompanyPayload`, not here. */
export interface AboutCompanyMoqPaymentSection {
  id: string;
  eyebrow: string;
  heading: string;
  introduction: string;
  supply_capacity_title: string;
  supply_capacity_description: string;
  commitment_title: string;
  commitment_description: string;
  cta_title: string;
  cta_description: string;
  cta_button_label: string;
  /** Not translated — a URL/anchor is not language-dependent content. */
  cta_button_href: string;
  translations?: Record<string, Record<string, string>> | null;
}

/** A compact highlight card above the Business Terms panel. `value` empty means "hide this
 * card on the public page" — an intentional admin signal, not an error state. */
export interface MoqPaymentQuickCard {
  id: string;
  label: string;
  value: string;
  icon: MoqPaymentQuickCardIcon;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** One row of the open-ended Business Terms panel — admin can add arbitrary custom terms
 * beyond the seeded defaults (e.g. "Incoterms", "Port of Loading") with no frontend change. */
export interface MoqPaymentBusinessTerm {
  id: string;
  label: string;
  value: string;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

export const SHIPMENT_ICON_KEYS = [
  "ship",
  "container",
  "warehouse",
  "map_pin",
  "globe",
  "calendar",
  "file_check",
  "package",
  "clipboard_check",
  "route",
] as const;
export type ShipmentIcon = (typeof SHIPMENT_ICON_KEYS)[number];
export const SHIPMENT_ICON_LABELS: Record<ShipmentIcon, string> = {
  ship: "Ship / Handshake",
  container: "Container / Box",
  warehouse: "Warehouse / Boxes",
  map_pin: "Map Pin",
  globe: "Globe",
  calendar: "Calendar / Clock",
  file_check: "Document Check",
  package: "Package",
  clipboard_check: "Clipboard Check",
  route: "Route / Delivery",
};

/** Section 07 "Facilities → Shipment Terms" — intro copy + "Our Commitment" quote block + CTA
 * (singleton). The six lists (Shipping Arrangement, Loading Locations, Container Types,
 * Shipping Schedule, Documents, Commitment items) live in `PublishedAboutCompanyPayload`. */
export interface AboutCompanyShipmentTermsSection {
  id: string;
  eyebrow: string;
  heading: string;
  introduction: string;
  commitment_title: string;
  commitment_description: string;
  cta_label: string;
  /** Not translated — a URL/anchor is not language-dependent content. */
  cta_href: string;
  cta_open_new_tab: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** One of the 7 "Shipping Arrangement" summary items — powers both the route journey labels
 * and the Information Cards grid. Independent from the deeper structured lists below (e.g. its
 * own "Loading Locations" text is separate from `ShipmentLoadingLocation`). */
export interface ShippingArrangementItem {
  id: string;
  icon: ShipmentIcon;
  title: string;
  value: string;
  description: string;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** A loading-location chip driving the route visual's origin nodes. */
export interface ShipmentLoadingLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  /** Not translated — a URL is not language-dependent content. `null` means no map link. */
  maps_url: string | null;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** A container size option for the interactive 20FT/40FT-style toggle. */
export interface ShipmentContainerType {
  id: string;
  label: string;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** One step of the compact "Shipping Schedule" mini-timeline. */
export interface ShipmentScheduleStep {
  id: string;
  name: string;
  description: string;
  icon: ShipmentIcon;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** One row of the optional "Documentation" expandable list — the public page shows no list at
 * all until the admin adds real documents (no fabricated defaults). */
export interface ShipmentDocument {
  id: string;
  name: string;
  description: string;
  /** Not translated — a URL is not language-dependent content. `null` means no linked file. */
  url: string | null;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** One of the 3 "Our Commitment" mini statement cards. */
export interface ShipmentCommitmentItem {
  id: string;
  title: string;
  description: string;
  icon: ShipmentIcon;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** Section 07 "Facilities → FAQ" — a dedicated, Facilities-only FAQ system (deliberately not
 * the shared `Faq` type, which also feeds the Homepage FAQ section). Intro copy + accordion
 * mode + CTA (singleton). Items live in `PublishedAboutCompanyPayload`. */
export interface AboutCompanyFacilitiesFaqSection {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  accordion_mode: "single" | "multiple";
  cta_title: string;
  cta_description: string;
  cta_primary_label: string;
  /** Not translated — a URL is not language-dependent content. */
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  translations?: Record<string, Record<string, string>> | null;
}

/** One product-name pill nested under a `FacilitiesFaqItem` (e.g. shown under FAQ 01). */
export interface FacilitiesFaqProductTag {
  id: string;
  faq_item_id: string;
  name: string;
  order: number;
  active: boolean;
  translations?: Record<string, Record<string, string>> | null;
}

/** One FAQ question/answer row. `category` and `featured` are admin-only metadata reserved
 * for future curation — not currently surfaced in the redesigned frontend. `icon`/
 * `highlight_text` are both optional; `icon` renders inside the expanded answer (falls back to
 * a generic icon when unset), `highlight_text` renders as a small badge only when set. */
export interface FacilitiesFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: string | null;
  featured: boolean;
  highlight_text: string | null;
  order: number;
  active: boolean;
  tags: FacilitiesFaqProductTag[];
  translations?: Record<string, Record<string, string>> | null;
}

export interface AboutCompanySettings {
  id: string;
  page_title: string;
  page_subtitle: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image: Media | null;
  visible: boolean;
}

/** One searchable row in the Admin's About Company content index — deliberately flat and
 * presentation-free so the Manager can search/filter/sort every kind of content (team members,
 * activities, documents, gallery images) through a single list. */
export type AboutCompanySearchItemType =
  | "section"
  | "fact"
  | "team_member"
  | "activity"
  | "document"
  | "gallery_image"
  | "factory_image"
  | "factory_document"
  | "facility"
  | "facility_image"
  | "moq_quick_card"
  | "moq_business_term"
  | "shipment_item"
  | "shipment_location"
  | "shipment_container"
  | "shipment_schedule"
  | "shipment_document"
  | "shipment_commitment"
  | "facilities_faq_item"
  | "facilities_faq_tag";

export const ABOUT_COMPANY_SEARCH_TYPE_LABELS: Record<AboutCompanySearchItemType, string> = {
  section: "Section",
  fact: "Company Fact",
  team_member: "Team",
  activity: "Activity",
  document: "Certificate",
  gallery_image: "Company Gallery",
  factory_image: "Factory",
  factory_document: "Factory Document",
  facility: "Facility",
  facility_image: "Facility Photo",
  moq_quick_card: "Quick Overview Card",
  moq_business_term: "Business Term",
  shipment_item: "Shipping Arrangement Item",
  shipment_location: "Loading Location",
  shipment_container: "Container Type",
  shipment_schedule: "Shipping Schedule Step",
  shipment_document: "Shipment Document",
  shipment_commitment: "Commitment Item",
  facilities_faq_item: "FAQ Item",
  facilities_faq_tag: "FAQ Product Tag",
};

export interface AboutCompanySearchItem {
  id: string;
  type: AboutCompanySearchItemType;
  section_key: AboutCompanySectionKey;
  label: string;
  sublabel: string | null;
  /** `null` for rows with no active flag of their own (sections, company gallery images). */
  active: boolean | null;
  featured: boolean;
  /** Attached file's display name and kind, when the row has one — powers the Images/PDFs filters. */
  file_name: string | null;
  file_type: "image" | "video" | "pdf" | null;
  order: number;
  updated_at: string;
}

/** The public About Company page's single data source — returned by
 * `GET /about-company/published-snapshot`. */
export interface PublishedAboutCompanyPayload {
  profile: AboutCompanyProfile;
  /** Company Facts rows for the profile section (active only in the published payload). */
  facts: AboutCompanyFact[];
  /** Export destinations shown on the profile section's world map. Same records the Homepage
   * "Global Export Reach" section uses — one export-country list for the whole site. */
  export_destinations: ExportDestination[];
  /** Active "Connect With PPN" social links, in display order. */
  social_links: AboutCompanySocialLink[];
  /** The subset of `export_destinations` curated for "Countries We Have Exported To"
   * (`show_in_company_profile: true`) — may be a different set than the Homepage map shows. */
  company_profile_countries: ExportDestination[];
  team_members: TeamMember[];
  team_section: AboutCompanyTeamSection;
  what_we_do_section: AboutCompanyWhatWeDoSection;
  what_we_do_items: WhatWeDoItem[];
  /** "Who We Supply" audience segments (active only, display order). */
  who_we_supply_items: WhoWeSupplyItem[];
  legal_documents: LegalCertificateDocument[];
  legal_section: AboutCompanyLegalSection;
  legal_categories: LegalDocumentCategory[];
  factory: FactoryProfile;
  facilities: Facility[];
  facilities_section: AboutCompanyFacilitiesSection;
  moq_payment_section: AboutCompanyMoqPaymentSection;
  moq_payment_quick_cards: MoqPaymentQuickCard[];
  moq_payment_business_terms: MoqPaymentBusinessTerm[];
  shipment_terms_section: AboutCompanyShipmentTermsSection;
  shipping_arrangement_items: ShippingArrangementItem[];
  shipment_loading_locations: ShipmentLoadingLocation[];
  shipment_container_types: ShipmentContainerType[];
  shipment_schedule_steps: ShipmentScheduleStep[];
  shipment_documents: ShipmentDocument[];
  shipment_commitment_items: ShipmentCommitmentItem[];
  facilities_faq_section: AboutCompanyFacilitiesFaqSection;
  facilities_faq_items: FacilitiesFaqItem[];
  settings: AboutCompanySettings;
  section_config: AboutCompanySectionConfig[];
}
