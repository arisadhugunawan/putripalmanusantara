"use client";

import { cn } from "@ppn/ui-components";
import Link from "next/link";
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
 * Jump between About Company sections without going back to the overview first — a horizontal
 * pill row on desktop, a single `<select>` on small screens so five destinations never push the
 * editor's own content below the fold.
 *
 * Navigation goes through the router rather than plain links on mobile because a `<select>` has
 * no href; both paths land on the same section routes.
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
    <nav aria-label="About Company sections" className="mt-3">
      <select
        value={currentHref}
        onChange={(event) => handleSelect(event.target.value)}
        aria-label="Pindah ke section lain"
        className="w-full rounded-field border border-neutral-300 bg-white px-3 py-2 text-small lg:hidden"
      >
        {DESTINATIONS.map((destination) => (
          <option key={destination.href} value={destination.href}>
            {destination.label}
          </option>
        ))}
      </select>

      <ul className="hidden flex-wrap items-center gap-2 lg:flex">
        {DESTINATIONS.map((destination) => {
          const isCurrent = destination.href === currentHref;
          return (
            <li key={destination.href}>
              <Link
                href={destination.href}
                aria-current={isCurrent ? "page" : undefined}
                onClick={(event) => {
                  if (isCurrent) return;
                  if (onNavigate?.(destination.href, event) === false) event.preventDefault();
                }}
                className={cn(
                  "inline-flex rounded-button border px-3 py-1 text-small transition-colors",
                  isCurrent
                    ? "border-primary-600 bg-primary-100 font-medium text-primary-700"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400",
                )}
              >
                {destination.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
