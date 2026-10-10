"use client";

import { useRouter } from "next/navigation";
import { ABOUT_COMPANY_SECTION_REGISTRY } from "@/app/admin/about-company/section-registry";

const DESTINATIONS = [
  ...ABOUT_COMPANY_SECTION_REGISTRY.map((entry) => ({
    href: `/admin/about-company/${entry.key}`,
    label: entry.label,
  })),
  { href: "/admin/about-company/settings", label: "About Company Settings" },
];

/**
 * Jump between About Company sections without going back to the overview first — one compact
 * selector at every breakpoint. The previous version paired this same `<select>` (mobile) with a
 * desktop pill row that wrapped its 10 long-label destinations across two lines even at 1440px,
 * pushing the editor's actual content down the page — a select never wraps, so it replaces the
 * pill row entirely rather than just supplementing it below `lg`.
 */
export function AboutCompanySectionNav({
  currentHref,
  onNavigate,
}: {
  currentHref: string;
  /** Lets the shell intercept the jump when the editor holds unsaved changes. */
  onNavigate?: (href: string, event?: React.MouseEvent) => boolean | void;
}) {
  const router = useRouter();

  function handleSelect(href: string) {
    if (href === currentHref) return;
    const intercepted = onNavigate?.(href);
    if (intercepted === false) return;
    router.push(href);
  }

  return (
    <nav aria-label="About Company sections" className="mt-2 flex items-center gap-2">
      <label htmlFor="about-company-section-nav" className="shrink-0 text-small text-neutral-500">
        Section
      </label>
      <select
        id="about-company-section-nav"
        value={currentHref}
        onChange={(event) => handleSelect(event.target.value)}
        className="w-full max-w-xs rounded-field border border-neutral-300 bg-white px-3 py-1.5 text-small font-medium text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
      >
        {DESTINATIONS.map((destination) => (
          <option key={destination.href} value={destination.href}>
            {destination.label}
          </option>
        ))}
      </select>
    </nav>
  );
}
