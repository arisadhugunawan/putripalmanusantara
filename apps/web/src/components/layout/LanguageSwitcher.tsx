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

/** Pill trigger (flag + language code + chevron) opening a flag/name list with a check on
 * the active locale — PPN's own green/white palette, not the dark/gold reference it was
 * modeled on (see README "Facilities Dropdown + Mobile Nav Redesign" for the branding rule). */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
    router.push(replaceLocaleInPath(pathname, next));
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
          "flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-body font-medium transition-colors",
          open
            ? "border-primary-600 bg-primary-50 text-neutral-900"
            : "border-primary-500 text-neutral-900 hover:bg-primary-50",
        )}
      >
        <span aria-hidden="true">{LOCALE_LABELS[locale].flag}</span>
        {locale.toUpperCase()}
        <ChevronIcon open={open} />
      </button>

      <div
        role="menu"
        aria-label={label}
        className={cn(
          "absolute right-0 z-50 mt-2 grid w-52 origin-top-right overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card-hover transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden p-2">
          {SUPPORTED_LOCALES.map((code) => {
            const isActive = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitem"
                onClick={() => selectLocale(code)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-field px-3 py-2.5 text-left text-body transition-colors",
                  isActive
                    ? "bg-primary-500 font-medium text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden="true">{LOCALE_LABELS[code].flag}</span>
                  {LOCALE_LABELS[code].name}
                </span>
                {isActive && <CheckIcon />}
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" className="shrink-0 text-neutral-900">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
