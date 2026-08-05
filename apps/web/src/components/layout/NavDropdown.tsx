"use client";

import { cn } from "@ppn/ui-components";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/Link";
import type { NavLink } from "@/lib/nav-config";

const CLOSE_DELAY_MS = 150;

/** Desktop nav dropdown — hover-to-open (with a close delay so a diagonal mouse path
 * between trigger and panel doesn't flicker-close it), click-to-toggle for keyboard/touch,
 * Escape and click-outside close it. Fade + slide-down via the same grid-rows technique
 * already used by Accordion.tsx, 200ms, transform/opacity only (no layout-triggering
 * properties). */
export function NavDropdown({ label, items }: { label: string; items: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isActive = items.some((item) => pathname === item.href.split("#")[0]);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

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

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 text-body text-neutral-600 transition-colors hover:text-neutral-900",
          isActive && "text-neutral-900 font-medium",
        )}
      >
        {label}
        <ChevronIcon open={open} />
      </button>

      <div
        role="menu"
        aria-label={label}
        className={cn(
          "absolute left-1/2 z-50 mt-3 grid w-64 -translate-x-1/2 origin-top overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card-hover transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden py-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-body text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
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
      className={cn("transition-transform duration-200", open && "rotate-180")}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
