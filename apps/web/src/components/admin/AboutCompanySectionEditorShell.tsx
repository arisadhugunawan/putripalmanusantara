"use client";

import type { AboutCompanyPublishStatus, AboutCompanySectionConfig } from "@ppn/shared-types";
import { resolveAboutCompanySectionStatus } from "@ppn/shared-types";
import { Button } from "@ppn/ui-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useSaveState } from "@/hooks/useSaveState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { AboutCompanySectionRegistryEntry } from "@/app/admin/about-company/section-registry";
import {
  AboutCompanyDraftBufferContext,
  type AboutCompanyDraftBuffer,
} from "./AboutCompanyDraftBuffer";
import { AboutCompanySectionNav } from "./AboutCompanySectionNav";
import { AboutCompanySectionStatusBadge } from "./AboutCompanySectionStatusBadge";
import { ConfirmDialog } from "./ConfirmDialog";
import { PublishAboutCompanyButton } from "./PublishAboutCompanyButton";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { Skeleton } from "./Skeleton";
import { useToast } from "./Toast";

interface ShellData {
  config: AboutCompanySectionConfig | null;
  publishStatus: AboutCompanyPublishStatus;
}

/**
 * Shared shell for every About Company section editor route — mirrors `SectionEditorShell.tsx`
 * (Homepage Manager), plus the draft-safety pieces this module's brief asks for: the section's
 * explicit Published/Draft/Hidden status, a sticky action bar, and an unsaved-changes guard.
 *
 * Save model: simple fields inside each editor autosave per-field on blur, and that write only
 * ever reaches the *draft* tables — the public page reads the published snapshot, so autosaving
 * still cannot change the live site. Long-form fields (rich text) are instead buffered locally
 * and register themselves through `AboutCompanyDraftBufferContext`; Discard / Save Draft below
 * act on exactly that buffered state and are hidden in sections that have none, rather than
 * being rendered as buttons that would do nothing.
 */
export function AboutCompanySectionEditorShell({
  section,
  children,
}: {
  section: AboutCompanySectionRegistryEntry;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [buffer, setBuffer] = useState<AboutCompanyDraftBuffer | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<string | null>(null);
  const { status: saveStatus, error: saveError, run } = useSaveState();
  const { showToast } = useToast();

  const fetchShellData = useCallback(async (): Promise<ShellData> => {
    const [sections, publishStatus] = await Promise.all([
      adminApi.get<AboutCompanySectionConfig[]>("/admin/about-company/sections"),
      adminApi.get<AboutCompanyPublishStatus>("/admin/about-company/publish-status"),
    ]);
    return { config: sections.find((s) => s.key === section.key) ?? null, publishStatus };
  }, [section.key]);

  const { data, status: loadStatus, reload, setData } = useAdminResource(fetchShellData);
  const config = data?.config ?? null;

  const isDirty = buffer?.isDirty ?? false;
  useUnsavedChangesWarning(isDirty);

  const register = useCallback((next: AboutCompanyDraftBuffer | null) => setBuffer(next), []);
  const contextValue = useMemo(() => ({ register }), [register]);

  async function toggleVisible() {
    if (!config) return;
    const nextVisible = !config.visible;
    const result = await run(() =>
      adminApi.put(`/admin/about-company/sections/${section.key}`, { visible: nextVisible }),
    );
    if (result.success) {
      setData((current) =>
        current && current.config ? { ...current, config: { ...current.config, visible: nextVisible } } : current,
      );
      showToast(
        nextVisible
          ? "Section akan tampil di halaman About setelah dipublikasikan."
          : "Section akan disembunyikan dari halaman About setelah dipublikasikan.",
      );
    } else {
      showToast("Gagal menyimpan visibilitas section.", "error");
    }
  }

  async function handleSaveDraft() {
    if (!buffer) return;
    setSavingDraft(true);
    const saved = await buffer.save();
    setSavingDraft(false);
    if (saved) void reload();
  }

  /** In-app navigation away from a dirty editor — Next's App Router has no global navigation
   * block, so every link the shell owns (Back, section nav) routes through this confirmation. */
  function handleBack(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isDirty) return;
    event.preventDefault();
    setPendingLeave("/admin/about-company");
  }

  function guardNavigation(href: string) {
    if (!isDirty) return true;
    setPendingLeave(href);
    return false;
  }

  const sectionStatus = config
    ? resolveAboutCompanySectionStatus(config, data?.publishStatus.last_published_at ?? null)
    : null;

  return (
    <AboutCompanyDraftBufferContext.Provider value={contextValue}>
      <div>
        <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <Link href="/admin/about-company" onClick={handleBack} className="text-small text-neutral-500 underline">
            ← Kembali ke About Company Manager
          </Link>
          <div className="mt-1.5 flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h3 text-neutral-900">{section.label}</h1>
                {loadStatus === "loading" && <Skeleton className="h-5 w-20" />}
                {isDirty ? (
                  <span className="inline-flex items-center gap-1.5 rounded-button bg-amber-100 px-2.5 py-1 text-small font-medium text-amber-900">
                    ● Unsaved Changes
                  </span>
                ) : (
                  sectionStatus && <AboutCompanySectionStatusBadge status={sectionStatus} />
                )}
              </div>
              <p className="text-small text-neutral-600">{section.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {config && (
                <label className="flex items-center gap-2 text-small text-neutral-700">
                  <input
                    type="checkbox"
                    checked={config.visible}
                    onChange={() => void toggleVisible()}
                    className="h-4 w-4"
                  />
                  Visible on Website
                </label>
              )}
              <SaveStateIndicator status={saveStatus} error={saveError} />
              {buffer && (
                <>
                  <button
                    type="button"
                    onClick={() => buffer.discard()}
                    disabled={!isDirty || savingDraft}
                    className="text-small text-neutral-600 underline disabled:opacity-40"
                  >
                    Discard
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleSaveDraft()}
                    disabled={!isDirty || savingDraft}
                  >
                    {savingDraft ? "Saving..." : "Save Draft"}
                  </Button>
                </>
              )}
              <a
                href="/admin/preview/about-company"
                target="_blank"
                rel="noopener noreferrer"
                className="text-small font-medium text-primary-700 underline"
              >
                Preview
              </a>
              <PublishAboutCompanyButton onPublished={() => void reload()} />
            </div>
          </div>

          <AboutCompanySectionNav
            currentHref={`/admin/about-company/${section.key}`}
            onNavigate={(href) => guardNavigation(href)}
          />
        </div>

        <div className="max-w-4xl px-4 py-5 sm:px-6">{children}</div>
      </div>

      {pendingLeave && (
        <ConfirmDialog
          title="You have unsaved changes."
          message="Perubahan yang belum disimpan akan hilang jika Anda meninggalkan halaman ini."
          confirmLabel="Leave Without Saving"
          cancelLabel="Stay"
          onConfirm={() => {
            const href = pendingLeave;
            setPendingLeave(null);
            router.push(href);
          }}
          onCancel={() => setPendingLeave(null)}
        />
      )}
    </AboutCompanyDraftBufferContext.Provider>
  );
}
