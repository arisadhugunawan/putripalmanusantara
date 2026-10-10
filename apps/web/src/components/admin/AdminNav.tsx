"use client";

import { cn } from "@ppn/ui-components";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AboutCompanyIcon,
  ActivityLogIcon,
  AiAssistantIcon,
  ChevronDownIcon,
  ContactIcon,
  FacilitiesIcon,
  GalleryIcon,
  HomeIcon,
  MediaIcon,
  NewsIcon,
  ProductsIcon,
  SettingsIcon,
} from "./AdminNavIcons";

export interface NavLeaf {
  label: string;
  href: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  /** Present + no `children` → a plain single link. Present + `children` → also clickable
   * (jumps to the group's own landing page) in addition to expanding. */
  href?: string;
  children?: NavLeaf[];
}

/**
 * Mirrors the public site's own top-level navigation (Home / About Company / Our Products /
 * Facilities / Gallery / News / Contact) one-for-one, so an administrator never has to learn a
 * second, admin-only structure — see README "Admin navigation". `Our Products`' children are
 * injected at render time (`AdminShell` fetches the live product list) rather than hardcoded
 * here, since products are themselves CMS-managed content that changes without a code deploy.
 */
export const CONTENT_NAV: NavGroup[] = [
  { key: "home", label: "Home", icon: HomeIcon, href: "/admin/homepage" },
  {
    key: "about-company",
    label: "About Company",
    icon: AboutCompanyIcon,
    href: "/admin/about-company",
    children: [
      { label: "CV. Putri Palma Nusantara", href: "/admin/about-company/company" },
      { label: "PPN Team", href: "/admin/about-company/team" },
      { label: "What We Supply", href: "/admin/about-company/what_we_do" },
      { label: "Legal & Certificates", href: "/admin/about-company/legal_certificate" },
      { label: "Factory", href: "/admin/about-company/factory" },
    ],
  },
  {
    key: "products",
    label: "Our Products",
    icon: ProductsIcon,
    href: "/admin/produk",
    children: [{ label: "All Products", href: "/admin/produk" }],
  },
  {
    key: "facilities",
    label: "Facilities",
    icon: FacilitiesIcon,
    href: "/admin/about-company/facilities",
    children: [
      { label: "Facilities", href: "/admin/about-company/facilities" },
      { label: "MOQ & Payment Terms", href: "/admin/about-company/moq_payment_terms" },
      { label: "Shipment Terms", href: "/admin/about-company/shipment_terms" },
      { label: "FAQ", href: "/admin/about-company/facilities_faq" },
    ],
  },
  {
    key: "gallery",
    label: "Gallery",
    icon: GalleryIcon,
    href: "/admin/galeri",
    children: [
      { label: "Overview", href: "/admin/galeri" },
      { label: "Categories", href: "/admin/galeri/kategori" },
      { label: "Media", href: "/admin/galeri/media" },
    ],
  },
  {
    key: "news",
    label: "News",
    icon: NewsIcon,
    href: "/admin/artikel",
    children: [
      { label: "All Articles", href: "/admin/artikel" },
      { label: "Categories", href: "/admin/artikel/kategori" },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    icon: ContactIcon,
    href: "/admin/pengaturan/kontak",
    children: [
      { label: "Contact Page", href: "/admin/pengaturan/kontak" },
      { label: "Quotation Requests", href: "/admin/kontak" },
    ],
  },
];

export const SYSTEM_NAV: NavGroup[] = [
  {
    key: "media",
    label: "Media",
    icon: MediaIcon,
    href: "/admin/media",
  },
  {
    key: "ai-assistant",
    label: "AI Assistant",
    icon: AiAssistantIcon,
    href: "/admin/ai",
    children: [
      { label: "General & Knowledge", href: "/admin/ai" },
      { label: "Quick Questions", href: "/admin/ai/quick-questions" },
      { label: "Analytics", href: "/admin/ai/analytics" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    href: "/admin/pengaturan",
    children: [
      { label: "General Settings", href: "/admin/pengaturan" },
      { label: "Brand & Logo", href: "/admin/pengaturan/brand-logo" },
      { label: "Inner Page Header", href: "/admin/pengaturan/page-header" },
      { label: "Footer Management", href: "/admin/pengaturan/footer" },
    ],
  },
];

// Not part of the static `SYSTEM_NAV` array — the Activity Log page is restricted to
// super_admin server-side (see `admin-activity-log.controller.ts`), so `AdminShell` only splices
// this in for admins whose role actually allows it, instead of showing a link every editor
// would just get a 403 clicking.
export const ACTIVITY_LOG_NAV_ITEM: NavGroup = {
  key: "activity-log",
  label: "Activity Log",
  icon: ActivityLogIcon,
  href: "/admin/activity-log",
};

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`))) {
    return true;
  }
  return Boolean(group.href) && (pathname === group.href || pathname.startsWith(`${group.href}/`));
}

/** Among a group's leaves, several can prefix-match the same pathname (e.g. both
 * `/admin/pengaturan` and `/admin/pengaturan/footer` "match" `/admin/pengaturan/footer`) — only
 * the most specific (longest href) one should ever read as active, never more than one at once. */
function findActiveLeafHref(children: NavLeaf[], pathname: string): string | null {
  let best: string | null = null;
  for (const leaf of children) {
    const matches = pathname === leaf.href || pathname.startsWith(`${leaf.href}/`);
    if (matches && (best === null || leaf.href.length > best.length)) best = leaf.href;
  }
  return best;
}

const EXPANDED_GROUPS_KEY = "admin.sidebar.expandedGroups";

/** Explicit open/closed override per group, keyed by group key. A group with no entry here falls
 * back to auto-expanding while active (see `open` below) — this is what lets a user explicitly
 * collapse the group they're currently inside, which a plain "expanded while active" boolean
 * can't represent (see `AdminNavList` docstring). */
function loadExpandedGroups(): Map<string, boolean> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.localStorage.getItem(EXPANDED_GROUPS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Map();
    return new Map(
      parsed.filter(
        (v): v is [string, boolean] => Array.isArray(v) && typeof v[0] === "string" && typeof v[1] === "boolean",
      ),
    );
  } catch {
    return new Map();
  }
}

/** Shared nav renderer — used by both the fixed desktop sidebar and the mobile/tablet drawer, so
 * the two never drift apart. `onNavigate` closes the drawer after a link is clicked (no-op on
 * desktop). Groups auto-expand when they contain the active page; clicking a group's own chevron
 * always toggles it — including the currently active group — and that explicit choice persists
 * to localStorage so it survives a refresh/navigation. (Multiple groups can stay open at once —
 * not an exclusive accordion.)
 *
 * The open/closed state is an explicit per-group override, not a plain "expanded while active"
 * boolean: a boolean can't represent "the user explicitly collapsed the group they're currently
 * inside," so a fresh visit to an active group's chevron looked unresponsive — the click toggled
 * the underlying set correctly, but `active` unconditionally forced the row back open regardless,
 * making "Collapse X" a no-op exactly when a user was most likely to reach for it.
 *
 * `collapsed` renders an icon-only rail (72px) — submenus and labels hide, each icon gets a
 * native `title` tooltip instead. Passing `collapsed` also disables the persisted-state localStorage
 * round-trip's *rendering* effects (state itself keeps tracking normally so it's ready the moment
 * the rail expands again). */
export function AdminNavList({
  groups,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const [overrides, setOverrides] = useState<Map<string, boolean>>(() => loadExpandedGroups());
  const activeLeafRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify([...overrides]));
    } catch {
      // Best-effort persistence — a private-browsing quota error shouldn't break navigation.
    }
  }, [overrides]);

  // Keeps the active submenu item visible when the sidebar's own scroll area is shorter than
  // its content — scrolls only the sidebar, never the page (brief item 69).
  useEffect(() => {
    activeLeafRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pathname]);

  /** Always flips the group's rendered state, regardless of why it was open — `currentlyOpen` is
   * the value this same render just showed the user, so one click reliably produces one visible
   * change no matter whether the group got there via `active` or a prior explicit override. */
  function toggle(key: string, currentlyOpen: boolean) {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(key, !currentlyOpen);
      return next;
    });
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {groups.map((group) => {
        const active = isGroupActive(group, pathname);
        const hasChildren = Boolean(group.children?.length);
        const open = !collapsed && (overrides.get(group.key) ?? active);
        const Icon = group.icon;
        const activeLeafHref = hasChildren ? findActiveLeafHref(group.children!, pathname) : null;

        return (
          <div key={group.key}>
            <div
              className={cn(
                "group flex items-center rounded-field text-body transition-colors",
                active ? "bg-primary-50 font-medium text-primary-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <Link
                href={group.href ?? "#"}
                onClick={onNavigate}
                title={collapsed ? group.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{group.label}</span>}
              </Link>
              {hasChildren && !collapsed && (
                <button
                  type="button"
                  onClick={() => toggle(group.key, open)}
                  aria-expanded={open}
                  aria-label={open ? `Collapse ${group.label}` : `Expand ${group.label}`}
                  className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <ChevronDownIcon className={cn("h-4 w-4 transition-transform duration-200", open ? "rotate-180" : "")} />
                </button>
              )}
            </div>

            {hasChildren && !collapsed && (
              <div
                className="grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div className="min-h-0">
                  <div className="ml-[27px] flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-3">
                    {group.children!.map((leaf) => {
                      const leafActive = leaf.href === activeLeafHref;
                      return (
                        <Link
                          key={leaf.href}
                          href={leaf.href}
                          ref={leafActive ? activeLeafRef : undefined}
                          onClick={onNavigate}
                          aria-current={leafActive ? "page" : undefined}
                          className={cn(
                            "truncate rounded-field px-2.5 py-2 text-small transition-colors",
                            leafActive
                              ? "bg-primary-50 font-medium text-primary-700"
                              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                          )}
                        >
                          {leaf.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
