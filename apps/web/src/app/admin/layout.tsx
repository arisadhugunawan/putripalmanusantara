import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/AdminGate";
import { AuthProvider } from "@/lib/admin/auth-context";

// Defense-in-depth alongside robots.txt's disallow (docs/06-architecture.md §7) — admin
// pages must never be indexed even if a crawler ignores robots.txt.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// docs/01-prd.md §5.2 — admin panel UI text is in Indonesian (lang attribute stays on the
// single root <html> from app/layout.tsx; App Router only supports one root document).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGate>{children}</AdminGate>
    </AuthProvider>
  );
}
