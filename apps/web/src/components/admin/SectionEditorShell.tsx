"use client";

import type { HomepageSectionConfig } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useSaveState } from "@/hooks/useSaveState";
import type { SectionRegistryEntry } from "@/app/admin/homepage/section-registry";
import { PublishHomepageButton } from "./PublishHomepageButton";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useToast } from "./Toast";

/**
 * Shared shell for every per-section editor route — breadcrumb back to the Homepage Manager,
 * the "Visible on Homepage" toggle (an additional gate layered over whatever visibility logic
 * the section already has — see README), and a sticky toolbar with Preview + Publish. Fields
 * inside each editor still autosave per-field on blur exactly as before (that write only ever
 * reaches the *draft* tables now — see Part A/B of the Homepage Manager rebuild — so there's no
 * separate batched "Save Draft" step to add here without changing how every editor works).
 */
export function SectionEditorShell({
  section,
  children,
}: {
  section: SectionRegistryEntry;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<HomepageSectionConfig | null>(null);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  async function load() {
    const sections = await adminApi.get<HomepageSectionConfig[]>("/admin/homepage/sections");
    setConfig(sections.find((s) => s.key === section.key) ?? null);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() sets state only inside its own async body, not synchronously in this effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on section change; `load` intentionally isn't memoized since it's only ever called here
  }, [section.key]);

  async function toggleVisible() {
    if (!config) return;
    const nextVisible = !config.visible;
    const result = await run(() =>
      adminApi.put(`/admin/homepage/sections/${section.key}`, { visible: nextVisible }),
    );
    if (result.success) {
      setConfig((c) => (c ? { ...c, visible: nextVisible } : c));
      showToast(
        nextVisible
          ? "Section akan tampil di beranda setelah dipublikasikan."
          : "Section akan disembunyikan dari beranda setelah dipublikasikan.",
      );
    } else {
      showToast("Gagal menyimpan visibilitas section.", "error");
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white px-6 py-4">
        <Link href="/admin/homepage" className="text-small text-neutral-500 underline">
          ← Kembali ke Homepage Manager
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-h3 text-neutral-900">{section.label}</h1>
            <p className="text-small text-neutral-600">{section.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {config && (
              <label className="flex items-center gap-2 text-small text-neutral-700">
                <input type="checkbox" checked={config.visible} onChange={() => void toggleVisible()} className="h-4 w-4" />
                Visible on Homepage
              </label>
            )}
            <SaveStateIndicator status={status} error={error} />
            <a
              href="/admin/preview/homepage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-small font-medium text-primary-700 underline"
            >
              Preview Homepage
            </a>
            <PublishHomepageButton />
          </div>
        </div>
      </div>

      <div className="max-w-4xl px-6 py-6">{children}</div>
    </div>
  );
}
