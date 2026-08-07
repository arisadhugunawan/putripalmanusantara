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
 * Single source of truth for the main nav, used by both Header and Footer (previously two
 * separately-maintained NAV_ITEMS arrays). "About Company" anchors into the About page's own
 * in-page sections (sticky nav + smooth scroll, see AboutNav.tsx) rather than separate
 * routes — see README "Internationalization & Header Redesign" section. "PPN Team" now has
 * honest (non-fabricated) content on the About page, so it's back in this dropdown.
 * "Facilities" is a dropdown into the Facilities page's own in-page sections (same anchor
 * pattern as "About Company" → AboutNav.tsx), and "Gallery" stays a separate flat top-level
 * link — see README "Facilities Page (Post-Launch)" section.
 */
export function getMainNavEntries(dict: Dictionary): NavEntry[] {
  return [
    { href: "/", label: dict.nav.home },
    {
      label: dict.nav.aboutCompany,
      items: [
        { href: "/about#company", label: dict.nav.aboutCompanyProfile },
        { href: "/about#team", label: dict.nav.aboutTeam },
        { href: "/about#what-we-do", label: dict.nav.aboutWhatWeDo },
        { href: "/about#legal", label: dict.nav.aboutLegalCertificate },
        { href: "/about#factory", label: dict.nav.aboutFactory },
      ],
    },
    // "Our Products" is populated with real product data by the caller (Header needs live
    // slugs from the CMS, not a hardcoded/possibly-stale list) — see Header.tsx.
    {
      label: dict.nav.facilities,
      items: [
        { href: "/facilities#facilities", label: dict.nav.facilitiesOverview },
        { href: "/facilities#production-process", label: dict.nav.facilitiesProductionProcess },
        { href: "/facilities#moq-payment", label: dict.nav.facilitiesMoqPayment },
        { href: "/facilities#shipment-terms", label: dict.nav.facilitiesShipmentTerms },
        { href: "/facilities#packaging-options", label: dict.nav.facilitiesPackagingOptions },
        { href: "/facilities#faq", label: dict.nav.facilitiesFaq },
      ],
    },
    { href: "/gallery", label: dict.nav.gallery },
    { href: "/articles", label: dict.nav.news },
    { href: "/contact", label: dict.nav.contact },
  ];
}
