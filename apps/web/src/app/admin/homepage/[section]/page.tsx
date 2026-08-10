"use client";

import { buttonVariants, cn } from "@ppn/ui-components";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SectionEditorShell } from "@/components/admin/SectionEditorShell";
import { getSectionRegistryEntry } from "../section-registry";

/**
 * Per-section editor route (`/admin/homepage/[section]`) — direct navigation and browser
 * refresh both work since this is a real URL segment, not client-only view state. Editors are
 * imported lazily via `next/dynamic` inside the registry, so opening one section never loads
 * every other section's code/data.
 */
export default function HomepageSectionPage() {
  const params = useParams<{ section: string }>();
  const entry = getSectionRegistryEntry(params.section);

  if (!entry) {
    return (
      <div className="p-8 text-center">
        <p className="text-body text-neutral-600">Section tidak ditemukan.</p>
        <Link href="/admin/homepage" className="mt-2 inline-block text-small text-primary-700 underline">
          ← Kembali ke Homepage Manager
        </Link>
      </div>
    );
  }

  if (entry.staticContent) {
    return (
      <SectionEditorShell section={entry}>
        <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-body text-neutral-600">
            Konten section ini masih teks statis — belum ada modul admin khusus untuk
            mengubah isinya. Urutan dan visibilitasnya di beranda tetap bisa diatur di atas.
          </p>
        </div>
      </SectionEditorShell>
    );
  }

  if (entry.managedElsewhere) {
    return (
      <SectionEditorShell section={entry}>
        <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-body text-neutral-600">Konten section ini dikelola di modul admin tersendiri.</p>
          <Link href={entry.managedElsewhere.href} className={cn("mt-4 inline-flex", buttonVariants("primary", "md"))}>
            {entry.managedElsewhere.label}
          </Link>
        </div>
      </SectionEditorShell>
    );
  }

  return (
    <SectionEditorShell section={entry}>
      <div className="flex flex-col gap-6">
        {entry.editors?.map((Editor, index) => (
          <Editor key={index} />
        ))}
      </div>
    </SectionEditorShell>
  );
}
