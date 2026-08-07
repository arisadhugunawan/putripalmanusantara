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
 * "Facilities" and "Gallery" are flat top-level links (previously grouped under one
 * "Facilities & Gallery" dropdown) — see README "Facilities Page (Post-Launch)" section for
 * why Facilities was promoted to its own menu item.
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
    { href: "/facilities", label: dict.nav.facilities },
    { href: "/gallery", label: dict.nav.gallery },
    { href: "/articles", label: dict.nav.news },
    { href: "/contact", label: dict.nav.contact },
  ];
}
