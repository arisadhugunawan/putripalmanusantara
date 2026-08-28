"use client";

import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LOCALE_COOKIE = "NEXT_LOCALE";

function replaceLocaleInPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  segments[1] = nextLocale; // segments[0] is "" (leading slash)
  return segments.join("/") || `/${nextLocale}`;
}

/** Plain-text trigger (flag + language code + chevron, no pill/border) opening a compact
 * flag/code list — mirrors a reference shipping-industry header's minimal nav-integrated style
 * rather than the boxed pill this used to be. Header-only now (the Footer's copy of this was
 * removed as a deliberate declutter — one switcher, not two). */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectLocale(next: Locale) {
    // document.cookie is a browser API setter (writes one cookie), not a mutation of an
    // external variable — the rule can't distinguish that for globals like `document`.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
    // Preserve the query string and hash by reading window.location directly at click time
    // (not the reactive useSearchParams() hook — that requires a Suspense boundary around
    // every page that renders it, and this component sits inside the layout that wraps every
    // page including the statically-generated ones, so the hook would force them all out of
    // static rendering) so switching language keeps the reader on the same
    // page/anchor/filter state instead of quietly dropping it.
    const { search, hash } = window.location;
    router.push(`${replaceLocaleInPath(pathname, next)}${search}${hash}`);
  }

  // Roving arrow-key navigation across the open menu — the WAI-ARIA menu pattern's expected
  // keyboard behavior beyond plain Tab order.
  function onMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const currentIndex = [...items].indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          // p-2.5 -m-2.5: grows the invisible hit area to the ~44px touch-target guideline
          // without changing the trigger's visible size (the negative margin cancels it back
          // out for layout purposes, so the header row's spacing is unaffected).
          "flex items-center gap-2 rounded-field p-2.5 -m-2.5 text-body font-medium transition-colors",
          open ? "text-primary-700" : "text-neutral-900 hover:text-primary-700",
        )}
      >
        <span aria-hidden="true" className="text-[17px] leading-none">
          {LOCALE_LABELS[locale].flag}
        </span>
        {locale.toUpperCase()}
        <ChevronIcon open={open} />
      </button>

      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        onKeyDown={onMenuKeyDown}
        className={cn(
          "absolute right-0 top-full z-50 mt-2 grid w-28 origin-top-right overflow-hidden rounded-field border border-neutral-200 bg-white shadow-card-hover transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden py-1">
          {SUPPORTED_LOCALES.map((code) => {
            const isActive = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitem"
                aria-current={isActive || undefined}
                onClick={() => selectLocale(code)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-body transition-colors hover:bg-neutral-50",
                  isActive ? "font-semibold text-primary-700" : "text-neutral-700",
                )}
              >
                <span aria-hidden="true" className="text-[17px] leading-none">
                  {LOCALE_LABELS[code].flag}
                </span>
                {code.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="10"
      height="10"
      aria-hidden="true"
      className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
