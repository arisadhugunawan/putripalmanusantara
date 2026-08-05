"use client";

import { cn } from "@ppn/ui-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/admin/auth-context";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/artikel", label: "Artikel" },
  { href: "/admin/galeri", label: "Galeri" },
  { href: "/admin/fasilitas", label: "Fasilitas" },
  { href: "/admin/proses-produksi", label: "Proses Produksi" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/kontak", label: "Kontak / Quotation" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white p-6 lg:flex">
        <Link href="/admin" className="text-h3 font-heading font-bold text-neutral-900">
          PPN Admin
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-field px-3 py-2.5 text-body transition-colors",
                  isActive
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <p className="text-body text-neutral-600">
            Masuk sebagai <span className="font-medium text-neutral-900">{admin?.name}</span>
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-body text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            Keluar
          </button>
        </header>
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
