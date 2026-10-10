"use client";

import type { HomepagePublishStatus, HomepageSectionConfig } from "@ppn/shared-types";
import { Badge, Card } from "@ppn/ui-components";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { PublishHistoryCard } from "@/components/admin/PublishHistoryCard";
import { PublishHomepageButton } from "@/components/admin/PublishHomepageButton";
import { useToast } from "@/components/admin/Toast";
import { DECORATIVE_GRAPHICS_EDITOR, SECTION_REGISTRY } from "./section-registry";

/**
 * Homepage Manager — replaces the old single long-scrolling form. Shows every section as a
 * compact card (name, description, Visible/Hidden, order) with a link to its own dedicated
 * editor route; only lightweight metadata loads here, never any section's actual content (see
 * README "Homepage Manager" — "don't load every editor's data simultaneously").
 */
export default function HomepageManagerPage() {
  const [sections, setSections] = useState<HomepageSectionConfig[] | null>(null);
  const [publishStatus, setPublishStatus] = useState<HomepagePublishStatus | null>(null);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  async function load() {
    const [sectionsData, statusData] = await Promise.all([
      adminApi.get<HomepageSectionConfig[]>("/admin/homepage/sections"),
      adminApi.get<HomepagePublishStatus>("/admin/homepage/publish-status"),
    ]);
    setSections(sectionsData);
    setPublishStatus(statusData);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleMove(index: number, direction: -1 | 1) {
    if (!sections) return;
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const a = sections[index];
    const b = sections[target];
    try {
      await Promise.all([
        adminApi.put(`/admin/homepage/sections/${a.key}`, { order: b.order }),
        adminApi.put(`/admin/homepage/sections/${b.key}`, { order: a.order }),
      ]);
      await load();
      showToast("Urutan section tersimpan sebagai draf — publikasikan untuk menerapkannya ke beranda.");
    } catch {
      showToast("Gagal memperbarui urutan section.", "error");
    }
  }

  const rows = sections
    ?.map((config) => ({ config, entry: SECTION_REGISTRY.find((s) => s.key === config.key) }))
    .filter((r): r is { config: HomepageSectionConfig; entry: (typeof SECTION_REGISTRY)[number] } => Boolean(r.entry))
    .sort((a, b) => a.config.order - b.config.order);

  const filteredRows = rows?.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.entry.label.toLowerCase().includes(q) ||
      r.entry.description.toLowerCase().includes(q) ||
      r.entry.key.toLowerCase().includes(q)
    );
  });

  const visibleCount = sections?.filter((s) => s.visible).length ?? 0;
  const hiddenCount = sections ? sections.length - visibleCount : 0;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-neutral-900">Homepage Manager</h1>
          <p className="mt-1 text-body text-neutral-600">Kelola, atur urutan, pratinjau, dan publikasikan konten beranda.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/preview/homepage" target="_blank" rel="noopener noreferrer" className="text-small font-medium text-primary-700 underline">
            Preview Homepage
          </a>
          <PublishHomepageButton onPublished={() => void load()} />
        </div>
      </div>

      {sections && (
        <Card className="mt-4">
          <div className="flex flex-wrap gap-6 text-small text-neutral-600">
            <span>
              <strong className="text-neutral-900">{sections.length}</strong> Sections
            </span>
            <span>
              <strong className="text-neutral-900">{visibleCount}</strong> Visible
            </span>
            <span>
              <strong className="text-neutral-900">{hiddenCount}</strong> Hidden
            </span>
            <span>
              Last Published:{" "}
              <strong className="text-neutral-900">
                {publishStatus?.last_published_at
                  ? new Date(publishStatus.last_published_at).toLocaleString("id-ID")
                  : "Belum pernah"}
              </strong>
            </span>
            {publishStatus?.has_unpublished_changes && (
              <Badge variant="neutral">● Ada perubahan belum dipublikasikan</Badge>
            )}
          </div>
        </Card>
      )}

      <PublishHistoryCard onRestored={() => void load()} />

      <div className="mt-6">
        <input
          type="text"
          placeholder="Cari section homepage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-field border border-neutral-300 px-4 py-2.5 text-body"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filteredRows?.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada section yang cocok dengan pencarian.</p>
        )}
        {filteredRows?.map(({ config, entry }, displayIndex) => {
          const trueIndex = rows?.findIndex((r) => r.config.key === config.key) ?? -1;
          return (
            <Card key={config.key} className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <span className="text-small font-semibold text-neutral-400">{String(displayIndex + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{entry.label}</p>
                  <p className="mt-0.5 text-small text-neutral-600">{entry.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={config.visible ? "primary" : "neutral"}>{config.visible ? "● Visible" : "○ Hidden"}</Badge>
                    {entry.managedElsewhere && <span className="text-small text-neutral-400">Dikelola di modul lain</span>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleMove(trueIndex, -1)}
                  disabled={trueIndex <= 0}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Naik
                </button>
                <button
                  type="button"
                  onClick={() => void handleMove(trueIndex, 1)}
                  disabled={trueIndex === (rows?.length ?? 0) - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <Link href={`/admin/homepage/${config.key}`} className="text-small font-medium text-primary-700 underline">
                  Manage →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <h2 className="text-h3 text-neutral-900">Decorative Graphics</h2>
        <p className="mt-1 text-small text-neutral-600">
          Elemen visual dekoratif (garis/ikon transparan) yang melapisi beberapa section sekaligus — bukan section
          tersendiri, sehingga tidak punya urutan/visibilitas sendiri di atas.
        </p>
        <div className="mt-4">
          <DECORATIVE_GRAPHICS_EDITOR />
        </div>
      </Card>
    </div>
  );
}
