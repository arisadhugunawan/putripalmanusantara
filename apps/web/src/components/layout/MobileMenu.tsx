"use client";

import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import { buttonVariants, cn } from "@ppn/ui-components";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Link } from "@/i18n/Link";
import { getMainNavEntries, isDropdown, type NavDropdownGroup, type NavEntry } from "@/lib/nav-config";
import type { Dictionary } from "@/i18n/dictionary.d";

const LOCALE_COOKIE = "NEXT_LOCALE";

function replaceLocaleInPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  segments[1] = nextLocale;
  return segments.join("/") || `/${nextLocale}`;
}

/** Strips the leading `/xx` locale segment so a route can be compared against nav-config's
 * locale-agnostic hrefs (e.g. pathname "/en" → "/", "/en/products" → "/products"). */
function stripLocale(pathname: string, locale: Locale) {
  const rest = pathname.slice(`/${locale}`.length);
  return rest === "" ? "/" : rest;
}

/**
 * Full-screen mobile nav overlay (its own logo + close bar, collapsible Language section,
 * active-pill highlight on the current page) — same panel used at every breakpoint below
 * `lg`, laid out full-width rather than a right-anchored drawer.
 */
export function MobileMenu({
  open,
  onClose,
  dictionary,
  locale,
  productsGroup,
}: {
  open: boolean;
  onClose: () => void;
  dictionary: Dictionary;
  locale: Locale;
  /** "Our Products" is a live CMS list, built by Header.tsx (see its own comment). */
  productsGroup: NavEntry;
}) {
  const pathname = usePathname();
  const normalizedPath = stripLocale(pathname, locale);
  const entries = getMainNavEntries(dictionary);
  // Insert the dynamic Our Products group right after About Company, matching the brief's order.
  entries.splice(2, 0, productsGroup);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dictionary.nav.openMenu}
      className={cn(
        "fixed inset-0 z-[60] flex w-full flex-col overflow-y-auto bg-white transition-transform duration-300 ease-out lg:hidden",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <Link href="/" onClick={onClose} className="font-heading text-h3 font-bold text-neutral-900">
          PPN
        </Link>
        <button
          type="button"
          aria-label={dictionary.nav.closeMenu}
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-field text-neutral-900 hover:bg-neutral-100"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-5 py-6">
        <MobileLanguageSection locale={locale} label={dictionary.nav.language} />

        <div className="my-2 border-t border-neutral-200" />

        {entries.map((entry) =>
          isDropdown(entry) ? (
            <MobileGroup key={entry.label} group={entry} onNavigate={onClose} locale={locale} />
          ) : (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onClose}
              className={cn(
                "rounded-field px-3 py-4 text-h3 transition-colors",
                normalizedPath === entry.href
                  ? "bg-primary-500 font-bold text-neutral-900"
                  : "text-neutral-900 hover:bg-neutral-100",
              )}
            >
              {entry.label}
            </Link>
          ),
        )}

        <Link href="/#request-quotation" onClick={onClose} className={cn("mt-4 w-full", buttonVariants("primary", "md"))}>
          {dictionary.nav.requestQuotation}
        </Link>
      </nav>
    </div>
  );
}

function MobileLanguageSection({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const panelId = useId();

  function selectLocale(next: Locale) {
    // document.cookie is a browser API setter (writes one cookie), not a mutation of an
    // external variable — the rule can't distinguish that for globals like `document`.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
    router.push(replaceLocaleInPath(pathname, next));
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-field px-3 py-4 text-left text-h3 text-neutral-900 hover:bg-neutral-100"
      >
        <span className="flex items-center gap-3">
          <GlobeIcon />
          {label}
        </span>
        <span className="flex items-center gap-2 text-body text-neutral-600">
          <span aria-hidden="true">{LOCALE_LABELS[locale].flag}</span>
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 py-1 pl-6">
            {SUPPORTED_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => selectLocale(code)}
                className={cn(
                  "flex w-full items-center justify-between rounded-field px-3 py-3 text-left text-body-lg transition-colors",
                  code === locale
                    ? "bg-primary-50 font-medium text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden="true">{LOCALE_LABELS[code].flag}</span>
                  {LOCALE_LABELS[code].name}
                </span>
                {code === locale && <CheckIcon />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileGroup({
  group,
  onNavigate,
  locale,
}: {
  group: NavDropdownGroup;
  onNavigate: () => void;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const normalizedPath = stripLocale(pathname, locale);
  const isActive = group.items.some((item) => normalizedPath === item.href.split("#")[0]);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center justify-between rounded-field px-3 py-4 text-left text-h3 text-neutral-900 hover:bg-neutral-100",
          isActive && "text-primary-700",
        )}
      >
        {group.label}
        <ChevronIcon open={open} />
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 py-1 pl-6">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="rounded-field px-3 py-3 text-body-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="14"
      height="14"
      aria-hidden="true"
      className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" className="shrink-0 text-primary-700">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
