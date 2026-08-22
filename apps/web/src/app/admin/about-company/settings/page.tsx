"use client";

import Link from "next/link";
import { AboutCompanySettingsEditor } from "../_editors/AboutCompanySettingsEditor";

export default function AboutCompanySettingsPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/about-company" className="text-small text-neutral-500 underline">
        ← Kembali ke About Company Manager
      </Link>
      <h1 className="mt-2 text-h2 text-neutral-900">About Company Settings</h1>
      <AboutCompanySettingsEditor />
    </div>
  );
}
