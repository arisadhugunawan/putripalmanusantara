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
 * separately-maintained NAV_ITEMS arrays). "About Company" and "Facilities & Gallery" anchor
 * into existing pages rather than new routes — see README "Internationalization & Header
 * Redesign" section for why ("PPN Team" has no real content and was dropped rather than
 * fabricated; "What We Do?"/"Factory" map to Production Process/Facilities, the closest real
 * pages, instead of non-existent About subpages).
 */
export function getMainNavEntries(dict: Dictionary): NavEntry[] {
  return [
    { href: "/", label: dict.nav.home },
    {
      label: dict.nav.aboutCompany,
      items: [
        { href: "/about#who-we-are", label: dict.nav.aboutCompanyProfile },
        { href: "/production-process", label: dict.nav.aboutWhatWeDo },
        { href: "/about#legal-certificate", label: dict.nav.aboutLegalCertificate },
        { href: "/facilities", label: dict.nav.aboutFactory },
      ],
    },
    // "Our Products" is populated with real product data by the caller (Header needs live
    // slugs from the CMS, not a hardcoded/possibly-stale list) — see Header.tsx.
    {
      label: dict.nav.facilitiesAndGallery,
      items: [
        { href: "/facilities", label: dict.nav.facilities },
        { href: "/gallery", label: dict.nav.gallery },
      ],
    },
    { href: "/articles", label: dict.nav.news },
    { href: "/contact", label: dict.nav.contact },
  ];
}
