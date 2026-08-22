import type { AboutCompanySectionKey } from "@ppn/shared-types";
import type { Dictionary } from "@/i18n/dictionary.d";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavDropdownGroup {
  label: string;
  items: NavLink[];
}

export type NavEntry = NavLink | NavDropdownGroup;

export function isDropdown(entry: NavEntry): entry is NavDropdownGroup {
  return "items" in entry;
}

/**
 * Which About Company entries the nav may show, derived from the *published* About Company
 * snapshot (Admin → About Company → Settings "Visible on Website", plus each section's own
 * visibility toggle). Draft changes never reach this: it comes from the same snapshot the
 * public `/about` page renders, so the nav and the page can never disagree.
 */
export interface AboutNavState {
  pageVisible: boolean;
  visibleSections: AboutCompanySectionKey[];
}

/** Used when the About Company API can't be reached — the pre-CMS behaviour (show everything)
 * is the safe default: a briefly stale menu beats a header that loses items on an API blip. */
export const DEFAULT_ABOUT_NAV_STATE: AboutNavState = {
  pageVisible: true,
  visibleSections: ["company", "team", "what_we_do", "legal_certificate", "factory"],
};

/** Section key → its in-page anchor and dictionary label. The anchors stay the pre-existing
 * hyphenated ids that `/about` renders (`#what-we-do`, `#legal`). */
const ABOUT_NAV_ITEM_ORDER: {
  key: AboutCompanySectionKey;
  href: string;
  dictKey: "aboutCompanyProfile" | "aboutTeam" | "aboutWhatWeDo" | "aboutLegalCertificate" | "aboutFactory";
}[] = [
  { key: "company", href: "/about#company", dictKey: "aboutCompanyProfile" },
  { key: "team", href: "/about#team", dictKey: "aboutTeam" },
  { key: "what_we_do", href: "/about#what-we-do", dictKey: "aboutWhatWeDo" },
  { key: "legal_certificate", href: "/about#legal", dictKey: "aboutLegalCertificate" },
  { key: "factory", href: "/about#factory", dictKey: "aboutFactory" },
];

/**
 * Single source of truth for the main nav, used by both Header and Footer (previously two
 * separately-maintained NAV_ITEMS arrays). "About Company" anchors into the About page's own
 * in-page sections (sticky nav + smooth scroll, see AboutNav.tsx) rather than separate
 * routes — see README "Internationalization & Header Redesign" section. "PPN Team" now has
 * honest (non-fabricated) content on the About page, so it's back in this dropdown.
 * "Facilities" is a dropdown into the Facilities page's own in-page sections (same anchor
 * pattern as "About Company" → AboutNav.tsx), and "Gallery" stays a separate flat top-level
 * link — see README "Facilities Page (Post-Launch)" section.
 */
export function getMainNavEntries(dict: Dictionary, about: AboutNavState = DEFAULT_ABOUT_NAV_STATE): NavEntry[] {
  const aboutGroup: NavDropdownGroup = {
    label: dict.nav.aboutCompany,
    items: ABOUT_NAV_ITEM_ORDER.filter((item) => about.visibleSections.includes(item.key)).map((item) => ({
      href: item.href,
      label: dict.nav[item.dictKey],
    })),
  };

  return [
    { href: "/", label: dict.nav.home },
    // Dropped entirely when the About page is hidden or every one of its sections is —
    // linking to a page that 404s would be worse than not offering the menu at all.
    ...(about.pageVisible && aboutGroup.items.length > 0 ? [aboutGroup] : []),
    // "Our Products" is populated with real product data by the caller (Header needs live
    // slugs from the CMS, not a hardcoded/possibly-stale list) — see Header.tsx.
    {
      label: dict.nav.facilities,
      items: [
        { href: "/facilities#facilities", label: dict.nav.facilitiesOverview },
        { href: "/production-process", label: dict.nav.facilitiesProductionProcess },
        { href: "/facilities#moq-payment", label: dict.nav.facilitiesMoqPayment },
        { href: "/facilities#shipment-terms", label: dict.nav.facilitiesShipmentTerms },
        { href: "/facilities#faq", label: dict.nav.facilitiesFaq },
      ],
    },
    { href: "/gallery", label: dict.nav.gallery },
    { href: "/articles", label: dict.nav.news },
    { href: "/contact", label: dict.nav.contact },
  ];
}

/**
 * Inserts the live "Our Products" group right after "About Company", matching the brief's menu
 * order. Position is computed rather than hardcoded, because the About Company group is
 * dropped entirely when the Admin hides that page — a fixed index would then land the products
 * menu in the wrong slot.
 */
export function withProductsGroup(entries: NavEntry[], productsGroup: NavEntry): NavEntry[] {
  const next = [...entries];
  const aboutIndex = next.findIndex((entry) => isDropdown(entry) && entry.items.some((i) => i.href.startsWith("/about")));
  next.splice(aboutIndex === -1 ? 1 : aboutIndex + 1, 0, productsGroup);
  return next;
}
