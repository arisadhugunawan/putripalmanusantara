"use client";

import type {
  AboutCompanyPublishStatus,
  AboutCompanySearchItem,
  AboutCompanySearchItemType,
  AboutCompanySectionConfig,
  AboutCompanySectionStatus,
} from "@ppn/shared-types";
import {
  ABOUT_COMPANY_SEARCH_TYPE_LABELS,
  resolveAboutCompanySectionStatus,
} from "@ppn/shared-types";
import { Card, cn } from "@ppn/ui-components";
import Link from "next/link";
import { useCallback, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AboutCompanyPublishHistoryCard } from "@/components/admin/AboutCompanyPublishHistoryCard";
import { AboutCompanySectionStatusBadge } from "@/components/admin/AboutCompanySectionStatusBadge";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { PublishAboutCompanyButton } from "@/components/admin/PublishAboutCompanyButton";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";
import { ABOUT_COMPANY_SECTION_REGISTRY } from "./section-registry";

type StatusFilter = "all" | AboutCompanySectionStatus;
type TypeFilter = "all" | AboutCompanySearchItemType;
type FileFilter = "all" | "image" | "pdf";
type ActiveFilter = "all" | "active" | "inactive";
type SortKey = "order" | "name" | "updated" | "newest" | "oldest";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Hidden" },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Semua tipe" },
  { value: "section", label: "Sections" },
  { value: "team_member", label: "Team" },
  { value: "activity", label: "Activities" },
  { value: "document", label: "Certificates" },
  { value: "gallery_image", label: "Company Gallery" },
  { value: "factory_image", label: "Factory" },
  { value: "facility", label: "Facility" },
  { value: "facility_image", label: "Facility Photo" },
  { value: "moq_quick_card", label: "Quick Overview Card" },
  { value: "moq_business_term", label: "Business Term" },
  { value: "shipment_item", label: "Shipping Arrangement Item" },
  { value: "shipment_location", label: "Loading Location" },
  { value: "shipment_container", label: "Container Type" },
  { value: "shipment_schedule", label: "Shipping Schedule Step" },
  { value: "shipment_document", label: "Shipment Document" },
  { value: "shipment_commitment", label: "Commitment Item" },
  { value: "facilities_faq_item", label: "FAQ Item" },
  { value: "facilities_faq_tag", label: "FAQ Product Tag" },
];

interface ManagerData {
  sections: AboutCompanySectionConfig[];
  publishStatus: AboutCompanyPublishStatus;
  index: AboutCompanySearchItem[];
}

/**
 * About Company Manager — Section Navigator overview, mirrors `admin/homepage/page.tsx`
 * (Homepage Manager) and adds the content-wide search / filter / sort this module's brief asks
 * for. The five section cards stay the default view; typing a query or picking a filter turns
 * the same list into search results that link straight into the owning section editor.
 *
 * Only lightweight metadata loads here (section config, publish status, and a flat search
 * index); each section's actual content is fetched by its own editor route.
 */
export default function AboutCompanyManagerPage() {
  const fetchManagerData = useCallback(async (): Promise<ManagerData> => {
    const [sections, publishStatus, index] = await Promise.all([
      adminApi.get<AboutCompanySectionConfig[]>("/admin/about-company/sections"),
      adminApi.get<AboutCompanyPublishStatus>("/admin/about-company/publish-status"),
      adminApi.get<AboutCompanySearchItem[]>("/admin/about-company/search-index"),
    ]);
    return { sections, publishStatus, index };
  }, []);

  const { data, status: loadStatus, reload, retry } = useAdminResource(fetchManagerData);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [fileFilter, setFileFilter] = useState<FileFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const { showToast } = useToast();

  const sections = data?.sections ?? null;
  const lastPublishedAt = data?.publishStatus.last_published_at ?? null;

  /** Section order is draft state: it only reaches the public page on the next Publish. */
  async function handleReorderSections(from: number, to: number) {
    if (!sections) return;
    if (to < 0 || to >= sections.length) return;
    const ordered = [...sections].sort((a, b) => a.order - b.order);
    const next = arrayMove(ordered, from, to);
    try {
      await Promise.all(
        next
          .map((section, index) =>
            section.order === index
              ? null
              : adminApi.put(`/admin/about-company/sections/${section.key}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
      showToast("Urutan section tersimpan sebagai draf — publikasikan untuk menerapkannya ke halaman About.");
    } catch {
      showToast("Gagal memperbarui urutan section.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorderSections(from, to));

  if (loadStatus === "error") {
    return (
      <div className="max-w-5xl">
        <h1 className="text-h2 text-neutral-900">About Company Manager</h1>
        <AdminLoadError onRetry={() => void retry()} />
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filtersActive =
    Boolean(query) || statusFilter !== "all" || typeFilter !== "all" || fileFilter !== "all" || activeFilter !== "all";
  const isSearching = filtersActive || sort !== "order";

  const sectionStatusByKey = new Map<string, AboutCompanySectionStatus>(
    (sections ?? []).map((section) => [section.key, resolveAboutCompanySectionStatus(section, lastPublishedAt)]),
  );

  const results = (data?.index ?? [])
    .filter((item) => {
      const sectionStatus = sectionStatusByKey.get(item.section_key);
      if (statusFilter !== "all" && sectionStatus !== statusFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (fileFilter !== "all" && item.file_type !== fileFilter) return false;
      if (activeFilter === "active" && item.active === false) return false;
      if (activeFilter === "inactive" && item.active !== false) return false;
      if (!query) return true;
      return (
        item.label.toLowerCase().includes(query) ||
        (item.sublabel ?? "").toLowerCase().includes(query) ||
        (item.file_name ?? "").toLowerCase().includes(query) ||
        ABOUT_COMPANY_SEARCH_TYPE_LABELS[item.type].toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case "name":
          return a.label.localeCompare(b.label);
        case "newest":
        case "updated":
          return b.updated_at.localeCompare(a.updated_at);
        case "oldest":
          return a.updated_at.localeCompare(b.updated_at);
        default:
          return a.order - b.order;
      }
    });

  const orderedSections = sections
    ? [...sections]
        .map((config) => ({
          config,
          entry: ABOUT_COMPANY_SECTION_REGISTRY.find((s) => s.key === config.key),
        }))
        .filter(
          (row): row is { config: AboutCompanySectionConfig; entry: (typeof ABOUT_COMPANY_SECTION_REGISTRY)[number] } =>
            Boolean(row.entry),
        )
        .sort((a, b) => a.config.order - b.config.order)
    : [];

  const visibleCount = sections?.filter((s) => s.visible).length ?? 0;
  const hiddenCount = sections ? sections.length - visibleCount : 0;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-neutral-900">About Company Manager</h1>
          <p className="mt-1 text-body text-neutral-600">
            Manage your company profile, team, business activities, certifications, and factory information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/preview/about-company"
            target="_blank"
            rel="noopener noreferrer"
            className="text-small font-medium text-primary-700 underline"
          >
            Preview Page
          </a>
          <PublishAboutCompanyButton onPublished={() => void reload()} />
        </div>
      </div>

      {loadStatus === "loading" || !sections ? (
        <div className="mt-6 flex flex-col gap-4">
          <SkeletonCard rows={0} />
          <SkeletonCard rows={0} />
          <SkeletonCard rows={0} />
        </div>
      ) : (
        <>
          <Card className="mt-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-small text-neutral-600">
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
                  {lastPublishedAt ? new Date(lastPublishedAt).toLocaleString("id-ID") : "Belum pernah"}
                </strong>
              </span>
              {data?.publishStatus.has_unpublished_changes && (
                <span className="inline-flex items-center rounded-button bg-amber-100 px-2.5 py-0.5 font-medium text-amber-900">
                  ● Ada perubahan belum dipublikasikan
                </span>
              )}
            </div>
          </Card>

          {!lastPublishedAt && (
            <div className="mt-4 rounded-card border border-amber-300 bg-amber-50 p-4" role="status">
              <p className="text-body font-medium text-amber-900">
                Halaman About Company belum pernah dipublikasikan.
              </p>
              <p className="mt-1 text-small text-amber-900">
                Selama belum dipublikasikan, <code>/about</code> tidak tayang di situs publik dan tautan “About
                Company” tidak muncul di Header/Footer — ini disengaja, supaya isi draf tidak pernah bocor ke
                pengunjung. Tekan <strong>Publish Changes</strong> untuk menerbitkannya.
              </p>
            </div>
          )}

          <AboutCompanyPublishHistoryCard onRestored={() => void reload()} />

          <Card className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                placeholder="Search About Company sections, team, documents, images..."
                aria-label="Search About Company content"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-field border border-neutral-300 px-4 py-2.5 text-body sm:max-w-md"
              />
              <label className="flex items-center gap-2 text-small text-neutral-600">
                Urutkan
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="rounded-field border border-neutral-300 bg-white px-3 py-2 text-small"
                >
                  <option value="order">Display Order</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="updated">Last Updated</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((filter) => (
                <FilterChip
                  key={filter.value}
                  label={filter.label}
                  selected={statusFilter === filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {TYPE_FILTERS.map((filter) => (
                <FilterChip
                  key={filter.value}
                  label={filter.label}
                  selected={typeFilter === filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FilterChip label="Semua file" selected={fileFilter === "all"} onClick={() => setFileFilter("all")} />
              <FilterChip label="Images" selected={fileFilter === "image"} onClick={() => setFileFilter("image")} />
              <FilterChip label="PDFs" selected={fileFilter === "pdf"} onClick={() => setFileFilter("pdf")} />
              <span className="mx-1 h-4 w-px bg-neutral-300" aria-hidden="true" />
              <FilterChip label="Semua" selected={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
              <FilterChip label="Active" selected={activeFilter === "active"} onClick={() => setActiveFilter("active")} />
              <FilterChip
                label="Inactive"
                selected={activeFilter === "inactive"}
                onClick={() => setActiveFilter("inactive")}
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setFileFilter("all");
                    setActiveFilter("all");
                    setSort("order");
                  }}
                  className="ml-auto text-small text-neutral-600 underline"
                >
                  Reset pencarian & filter
                </button>
              )}
            </div>
          </Card>

          {isSearching ? (
            <div className="mt-6">
              <p className="text-small text-neutral-600">
                {results.length} hasil{query ? ` untuk “${search.trim()}”` : ""}
              </p>
              {results.length === 0 && (
                <div className="mt-3 rounded-card border border-dashed border-neutral-300 p-8 text-center">
                  <p className="text-body text-neutral-600">Tidak ada konten yang cocok dengan pencarian/filter.</p>
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2">
                {results.map((item) => (
                  <SearchResultRow
                    key={`${item.type}-${item.id}`}
                    item={item}
                    sectionStatus={sectionStatusByKey.get(item.section_key) ?? "draft"}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-small text-neutral-500">
                Seret kartu untuk mengubah urutan section, atau gunakan Naik/Turun. Perubahan urutan tersimpan sebagai
                draf sampai Anda menekan Publish Changes.
              </p>
              {orderedSections.map(({ config, entry }, index) => {
                const rowProps = getRowProps(index);
                return (
                  <Card
                    key={config.key}
                    {...rowProps}
                    className={cn("flex flex-wrap items-center justify-between gap-4 transition-opacity", rowProps.className)}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span {...getHandleProps(index)} className={cn("mt-1", getHandleProps(index).className)}>
                        <DragHandle />
                      </span>
                      <span className="mt-0.5 text-small font-semibold text-neutral-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">{entry.label}</p>
                        <p className="mt-0.5 text-small text-neutral-600">{entry.description}</p>
                        <div className="mt-2">
                          <AboutCompanySectionStatusBadge
                            status={resolveAboutCompanySectionStatus(config, lastPublishedAt)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleReorderSections(index, index - 1)}
                        disabled={index === 0}
                        className="text-small text-neutral-600 underline disabled:opacity-30"
                      >
                        Naik
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReorderSections(index, index + 1)}
                        disabled={index === orderedSections.length - 1}
                        className="text-small text-neutral-600 underline disabled:opacity-30"
                      >
                        Turun
                      </button>
                      <Link
                        href={`/admin/about-company/${config.key}`}
                        className="text-small font-medium text-primary-700 underline"
                      >
                        Manage →
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-h3 text-neutral-900">About Company Settings</h2>
          <p className="mt-1 text-small text-neutral-600">Page Title, SEO, OG Image, dan visibilitas halaman.</p>
        </div>
        <Link href="/admin/about-company/settings" className="shrink-0 text-small font-medium text-primary-700 underline">
          Manage →
        </Link>
      </Card>
    </div>
  );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-button border px-3 py-1 text-small transition-colors",
        selected
          ? "border-primary-600 bg-primary-100 text-primary-700"
          : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400",
      )}
    >
      {label}
    </button>
  );
}

function SearchResultRow({
  item,
  sectionStatus,
}: {
  item: AboutCompanySearchItem;
  sectionStatus: AboutCompanySectionStatus;
}) {
  const href =
    item.type === "section" ? `/admin/about-company/${item.section_key}` : `/admin/about-company/${item.section_key}`;

  return (
    <Link
      href={href}
      className="flex flex-wrap items-center justify-between gap-3 rounded-field border border-neutral-200 bg-white p-3 transition-colors hover:border-primary-600"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-neutral-900">{item.label}</p>
          <span className="rounded-button bg-neutral-100 px-2 py-0.5 text-small text-neutral-600">
            {ABOUT_COMPANY_SEARCH_TYPE_LABELS[item.type]}
          </span>
          {item.file_type && (
            <span className="rounded-button bg-neutral-100 px-2 py-0.5 text-small text-neutral-600">
              {item.file_type === "pdf" ? "PDF" : "Image"}
            </span>
          )}
          {item.active === false && (
            <span className="rounded-button bg-neutral-100 px-2 py-0.5 text-small text-neutral-600">Inactive</span>
          )}
        </div>
        {item.sublabel && <p className="mt-0.5 truncate text-small text-neutral-500">{item.sublabel}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <AboutCompanySectionStatusBadge status={sectionStatus} />
        <span className="text-small font-medium text-primary-700 underline">Buka →</span>
      </div>
    </Link>
  );
}
