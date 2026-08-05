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
  const entries = getMainNavEntries(dictionary);
  // Insert the dynamic Our Products group right after About Company, matching the brief's order.
  entries.splice(2, 0, productsGroup);

  return (
    <>
      {/* Backdrop — blurred, fades in/out; pointer-events off while hidden so it never
          eats clicks on the page behind it. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dictionary.nav.openMenu}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-white shadow-card-hover transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex flex-1 flex-col gap-1 px-5 py-8">
          {entries.map((entry) =>
            isDropdown(entry) ? (
              <MobileGroup key={entry.label} group={entry} onNavigate={onClose} />
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={onClose}
                className="rounded-field px-3 py-4 text-h3 text-neutral-900 hover:bg-neutral-100"
              >
                {entry.label}
              </Link>
            ),
          )}

          <Link href="/#request-quotation" onClick={onClose} className={cn("mt-4 w-full", buttonVariants("primary", "md"))}>
            {dictionary.nav.requestQuotation}
          </Link>
        </nav>

        <div className="border-t border-neutral-200 px-5 py-6">
          <p className="mb-3 text-small font-medium uppercase tracking-wide text-neutral-600">
            {dictionary.nav.language}
          </p>
          <MobileLanguageGrid locale={locale} />
        </div>
      </div>
    </>
  );
}

function MobileGroup({
  group,
  onNavigate,
}: {
  group: NavDropdownGroup;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const isActive = group.items.some((item) => pathname === item.href.split("#")[0]);

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
        <svg
          viewBox="0 0 12 12"
          width="14"
          height="14"
          aria-hidden="true"
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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

function MobileLanguageGrid({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function selectLocale(next: Locale) {
    // document.cookie is a browser API setter (writes one cookie), not a mutation of an
    // external variable — the rule can't distinguish that for globals like `document`.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.push(replaceLocaleInPath(pathname, next));
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => selectLocale(code)}
          className={cn(
            "flex items-center gap-2 rounded-field border px-3 py-2.5 text-left text-body transition-colors",
            code === locale
              ? "border-primary-500 bg-primary-50 font-medium text-neutral-900"
              : "border-neutral-200 text-neutral-600 hover:bg-neutral-100",
          )}
        >
          <span aria-hidden="true">{LOCALE_LABELS[code].flag}</span>
          {LOCALE_LABELS[code].name}
        </button>
      ))}
    </div>
  );
}
