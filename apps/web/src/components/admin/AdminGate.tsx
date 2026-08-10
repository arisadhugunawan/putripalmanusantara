"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/admin/auth-context";
import { AdminShell } from "./AdminShell";

const PUBLIC_PATHS = ["/admin/login"];
// Still requires auth (not in PUBLIC_PATHS) but renders full-width, without the sidebar shell
// — the Homepage draft preview needs to look like the real public page, not an admin screen.
const BARE_PATH_PREFIXES = ["/admin/preview"];

/**
 * docs/06-architecture.md §4 — Admin Panel is CSR behind authentication. The auth cookie
 * is HttpOnly and scoped to the API's own origin, so it can't be read by Next.js
 * middleware on the frontend origin; the browser still attaches it automatically to
 * credentialed fetches, so auth is checked client-side via GET /admin/auth/me.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isPublicPath && status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [isPublicPath, status, router]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-body text-neutral-600">Memuat...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const isBarePath = BARE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isBarePath) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
