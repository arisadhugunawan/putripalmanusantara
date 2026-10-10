"use client";

import { cn } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAuth } from "@/lib/admin/auth-context";
import { ACTIVITY_LOG_NAV_ITEM, AdminNavList, CONTENT_NAV, SYSTEM_NAV, type NavGroup } from "./AdminNav";
import { SidebarCollapseIcon } from "./AdminNavIcons";
import { ToastProvider } from "./Toast";

const SIDEBAR_COLLAPSED_KEY = "admin.sidebar.collapsed";
const SIDEBAR_WIDTH_EXPANDED = "w-[280px]";
const SIDEBAR_WIDTH_COLLAPSED = "w-[72px]";

function loadCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Admin shell — fixed sidebar + sticky topbar + independently-scrolling content, wrapping every
 * authenticated `/admin/*` page. Only this shell scrolls internally (`h-dvh overflow-hidden` on
 * the root, `overflow-y-auto` on `<main>` alone) — previously the whole document scrolled, which
 * dragged the sidebar away with it since it had no `position: fixed`/height constraint.
 *
 * The sidebar mirrors the public site's own nav (see `AdminNav.tsx`) one-for-one: fixed + a
 * manual collapse-to-icon-rail toggle on desktop/tablet (persisted to localStorage), a slide-in
 * drawer on mobile below `lg`. `Our Products`' submenu is populated from the live product list
 * rather than hardcoded, so it never drifts from what buyers actually see.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => loadCollapsedPreference());
  const [products, setProducts] = useState<ProductSummary[] | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // Best-effort — a private-browsing quota error shouldn't block the toggle itself.
    }
  }, [collapsed]);

  // ESC closes the mobile drawer; body scroll is locked while it's open so the page behind it
  // can't be dragged, and always restored on close/unmount (brief items 72, 79).
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<ProductSummary[]>("/admin/products")
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the drawer automatically on every route change (link clicks already do this via
  // `onNavigate`, but this also covers browser back/forward). Adjusted during render (React's
  // documented pattern for state that must reset when a prop changes) rather than in an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  const contentNav = useMemo<NavGroup[]>(() => {
    return CONTENT_NAV.map((group) => {
      if (group.key !== "products") return group;
      const productLeaves = (products ?? []).map((product) => ({
        label: product.name,
        href: `/admin/produk/${product.id}`,
      }));
      return { ...group, children: [{ label: "All Products", href: "/admin/produk" }, ...productLeaves] };
    });
  }, [products]);

  // Activity Log is super_admin-only server-side — only show the link to admins it won't 403
  // for, spliced after AI Assistant / before Settings to match the rest of the System group.
  const systemNav = useMemo<NavGroup[]>(() => {
    if (admin?.role !== "super_admin") return SYSTEM_NAV;
    const settingsIndex = SYSTEM_NAV.findIndex((g) => g.key === "settings");
    const withActivityLog = [...SYSTEM_NAV];
    withActivityLog.splice(settingsIndex, 0, ACTIVITY_LOG_NAV_ITEM);
    return withActivityLog;
  }, [admin?.role]);

  return (
    <ToastProvider>
      {/* h-dvh + overflow-hidden confines all scrolling to <main> below — the sidebar and topbar
       * never move. */}
      <div className="flex h-dvh overflow-hidden bg-neutral-100">
        {/* Desktop/tablet — fixed sidebar, independent internal scroll (SidebarContent's own
         * overflow-y-auto), collapsible to a 72px icon rail. */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 ease-out lg:flex",
            collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          )}
        >
          <SidebarContent contentNav={contentNav} systemNav={systemNav} pathname={pathname} collapsed={collapsed} />
        </aside>

        {/* Desktop/tablet collapse toggle — floats on the sidebar's edge so it stays reachable
         * regardless of scroll position inside the sidebar. */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "fixed top-[72px] z-30 hidden h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-[left] duration-200 ease-out hover:text-neutral-900 lg:flex",
            collapsed ? "left-[72px]" : "left-[280px]",
          )}
        >
          <SidebarCollapseIcon className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>

        {/* Mobile — drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-neutral-900/40"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[320px] flex-col bg-white shadow-xl">
              <SidebarContent
                contentNav={contentNav}
                systemNav={systemNav}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </aside>
          </div>
        )}

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-[margin-left] duration-200 ease-out",
            collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]",
          )}
        >
          <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-field text-neutral-600 hover:bg-neutral-100 lg:hidden"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" fill="none" />
                </svg>
              </button>
              <p className="hidden text-body text-neutral-600 sm:block">
                Masuk sebagai <span className="font-medium text-neutral-900">{admin?.name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-body text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
            >
              Keluar
            </button>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

function SidebarContent({
  contentNav,
  systemNav,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  contentNav: NavGroup[];
  systemNav: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <>
      {/* sticky: stays pinned at the top of the sidebar's own scroll area, never scrolls with
       * the nav list below it (brief item 64). */}
      <div
        className={cn(
          "sticky top-0 z-10 shrink-0 border-b border-neutral-100 bg-white py-6",
          collapsed ? "px-0 text-center" : "px-6",
        )}
      >
        <Link href="/admin" onClick={onNavigate} className="text-h3 font-heading font-bold text-neutral-900">
          PPN
        </Link>
        {!collapsed && (
          <p className="mt-0.5 text-small font-medium uppercase tracking-[0.1em] text-neutral-400">Content Management</p>
        )}
      </div>
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden py-5", collapsed ? "px-2" : "px-4")}>
        <AdminNavList groups={contentNav} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />

        <div className="mt-6 border-t border-neutral-100 pt-5">
          <AdminNavList groups={systemNav} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 border-t border-neutral-100 py-4 text-small text-neutral-400",
          collapsed ? "px-2 text-center" : "px-6",
        )}
      >
        {collapsed ? "PPN" : "CV. Putri Palma Nusantara"}
      </div>
    </>
  );
}
