"use client";

import type { ExportDestination } from "@ppn/shared-types";
import { useEffect, useRef } from "react";
import { flagEmoji } from "./flagEmoji";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Section 21 — country detail panel. Same accessible-modal mechanics as `TeamMemberModal.tsx`
 * (focus moves in on open, Tab is trapped inside, Escape closes, focus returns to the card that
 * opened it). Region/description only render when the Admin actually entered them. */
export function CountryDetailModal({
  country,
  onClose,
}: {
  country: ExportDestination;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={country.country_name}
        className="w-full max-w-sm rounded-card bg-white p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-4xl leading-none" aria-hidden="true">
              {flagEmoji(country.country_code)}
            </span>
            <h3 className="mt-3 text-h3 text-neutral-900">{country.country_name}</h3>
            {country.region && <p className="mt-1 text-body text-neutral-500">{country.region}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-button p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {country.description && <p className="mt-5 text-body text-neutral-600">{country.description}</p>}
      </div>
    </div>
  );
}
