"use client";

import type { Locale, ProductSummary, PublicSiteBranding } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import {
  DEFAULT_ABOUT_NAV_STATE,
  getMainNavEntries,
  isDropdown,
  withProductsGroup,
  type AboutNavState,
  type NavDropdownGroup,
} from "@/lib/nav-config";
import { BrandLogoImage } from "./BrandLogoImage";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { NavDropdown } from "./NavDropdown";

const SCROLL_SOLID_THRESHOLD = 8;
const SCROLL_SHRINK_THRESHOLD = 80;
/** Below this, the header never auto-hides — avoids a jumpy hide/show right at the top. */
const SCROLL_HIDE_MIN = 160;

export function Header({
  dictionary,
  locale,
  products,
  branding,
  aboutNav = DEFAULT_ABOUT_NAV_STATE,
}: {
  dictionary: Dictionary;
  locale: Locale;
  products: ProductSummary[];
  branding: PublicSiteBranding;
  /** Published About Company visibility — see `AboutNavState`. */
  aboutNav?: AboutNavState;
}) {
  const [solid, setSolid] = useState(false);
  const [shrunk, setShrunk] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  // Close the mobile drawer on navigation — adjusted during render (React's recommended
  // pattern for state that must reset when a prop/value changes) rather than in an effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setSolid(y > SCROLL_SOLID_THRESHOLD);
      setShrunk(y > SCROLL_SHRINK_THRESHOLD);

      if (y > SCROLL_HIDE_MIN) {
        setHidden(y > lastScrollY.current);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const productsGroup: NavDropdownGroup = {
    label: dictionary.nav.ourProducts,
    items: products.map((product) => ({ href: `/products/${product.slug}`, label: product.name })),
  };
  const entries = withProductsGroup(getMainNavEntries(dictionary, aboutNav), productsGroup);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transform-gpu transition-transform duration-300 ease-out",
          hidden && "-translate-y-full",
        )}
      >
      <div
        className={cn(
          "border-b backdrop-blur-md transition-[background-color,box-shadow] duration-300",
          solid ? "border-transparent bg-white/90 shadow-card" : "border-neutral-200/80 bg-white/80",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-(--container-page) items-center justify-between px-5 transition-[padding] duration-300 sm:px-8",
            shrunk ? "py-3" : "py-4",
          )}
        >
          <Link href="/" className="flex shrink-0 items-center" aria-label={dictionary.nav.home}>
            {branding.header_logo && (
              <BrandLogoImage
                media={branding.header_logo}
                altText={branding.header_logo_alt}
                priority
                className="hidden h-14 w-[240px] sm:block"
              />
            )}
            {branding.mobile_logo && (
              <BrandLogoImage
                media={branding.mobile_logo}
                altText={branding.mobile_logo_alt}
                priority
                className="h-11 w-[180px] sm:hidden"
              />
            )}
            {!branding.header_logo && !branding.mobile_logo && (
              <span
                className={cn(
                  "font-heading font-bold text-neutral-900 transition-[font-size] duration-300",
                  shrunk ? "text-h3" : "text-h2",
                )}
              >
                PPN
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-7 xl:flex" aria-label={dictionary.nav.home}>
            {entries.map((entry) =>
              isDropdown(entry) ? (
                <NavDropdown key={entry.label} label={entry.label} items={entry.items} />
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cn(
                    "text-body text-neutral-600 transition-colors hover:text-neutral-900",
                    pathname === entry.href && "font-medium text-neutral-900",
                  )}
                >
                  {entry.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
            <button
              type="button"
              aria-label={menuOpen ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-field text-neutral-900"
            >
              <span className="relative block h-4 w-6">
                <span
                  className={cn(
                    "absolute left-0 top-0 h-0.5 w-6 bg-current transition-transform duration-200",
                    menuOpen && "translate-y-[7px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-[7px] h-0.5 w-6 bg-current transition-opacity duration-200",
                    menuOpen && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-[14px] h-0.5 w-6 bg-current transition-transform duration-200",
                    menuOpen && "-translate-y-[7px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Rendered as a sibling, not a header child — a `transform` on an ancestor (the
          header above uses transform-gpu for the hide/show animation) creates a new
          containing block, which would make this drawer's `fixed inset-y-0` resolve
          against the header's own box instead of the viewport. */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        dictionary={dictionary}
        locale={locale}
        productsGroup={productsGroup}
        branding={branding}
        aboutNav={aboutNav}
      />
    </>
  );
}
