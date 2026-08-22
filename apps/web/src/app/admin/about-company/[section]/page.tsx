"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AboutCompanySectionEditorShell } from "@/components/admin/AboutCompanySectionEditorShell";
import { getAboutCompanySectionRegistryEntry } from "../section-registry";

/**
 * Per-section editor route (`/admin/about-company/[section]`) — direct navigation and browser
 * refresh both work since this is a real URL segment. Editors are imported lazily via
 * `next/dynamic` inside the registry (see `section-registry.ts`), so opening one section never
 * loads every other section's code/data. Mirrors `admin/homepage/[section]/page.tsx`.
 */
export default function AboutCompanySectionPage() {
  const params = useParams<{ section: string }>();
  const entry = getAboutCompanySectionRegistryEntry(params.section);

  if (!entry) {
    return (
      <div className="p-8 text-center">
        <p className="text-body text-neutral-600">Section tidak ditemukan.</p>
        <Link href="/admin/about-company" className="mt-2 inline-block text-small text-primary-700 underline">
          ← Kembali ke About Company Manager
        </Link>
      </div>
    );
  }

  return (
    <AboutCompanySectionEditorShell section={entry}>
      <div className="flex flex-col gap-6">
        {entry.editors.map((Editor, index) => (
          <Editor key={index} />
        ))}
      </div>
    </AboutCompanySectionEditorShell>
  );
}
