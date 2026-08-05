"use client";

import { buttonVariants, cn } from "@ppn/ui-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Main navigation — docs/01-prd.md §8 (final; Articles is intentionally excluded, FR-ART-04). */
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/production-process", label: "Production Process" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact Us" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      setScrolled(window.scrollY > 8);
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200",
        scrolled ? "bg-white/90 backdrop-blur-sm shadow-card" : "bg-white",
      )}
    >
      <div className="mx-auto flex max-w-(--container-page) items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="text-h3 font-heading font-bold text-neutral-900">
          PPN
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-body text-neutral-600 transition-colors hover:text-neutral-900",
                  isActive && "text-neutral-900 font-medium underline underline-offset-8 decoration-primary-500",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/#request-quotation" className={cn("hidden lg:inline-flex", buttonVariants("primary", "sm"))}>
          Request Quotation
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-field text-neutral-900 lg:hidden"
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

      {/* Mobile fullscreen drawer — docs/03-design.md §5.3 */}
      <div
        className={cn(
          "fixed inset-x-0 top-[65px] bottom-0 z-40 bg-white transition-transform duration-300 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex h-full flex-col gap-2 px-5 py-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-field px-3 py-4 text-h3 text-neutral-900 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#request-quotation"
            className={cn("mt-4 w-full", buttonVariants("primary", "md"))}
          >
            Request Quotation
          </Link>
        </nav>
      </div>
    </header>
  );
}
