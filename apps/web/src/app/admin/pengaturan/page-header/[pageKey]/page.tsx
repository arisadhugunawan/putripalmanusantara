"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import {
  GLOBAL_DEFAULT_PAGE_HEADER_KEY,
  PAGE_HEADER_HEIGHT_PRESETS,
  PAGE_HEADER_OVERLAY_TYPES,
  PAGE_HEADER_POSITIONS,
  PAGE_HEADER_SYSTEM_DEFAULTS as SYSTEM_DEFAULTS,
  type Locale,
  type Media,
  type PageHeader,
  type PageHeaderHeightPreset,
  type PageHeaderOverlayType,
  type PageHeaderPosition,
  type ResolvedPageHeader,
  type Translations,
} from "@ppn/shared-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ColorPickerField } from "@/components/admin/ColorPickerField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { BackgroundImageUpload } from "@/components/admin/BackgroundImageUpload";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";
import { PageHeaderPreview } from "@/components/page/PageHeaderPreview";
import { pageHeaderLabel } from "../page-header-labels";

const OVERLAY_LABELS: Record<PageHeaderOverlayType, string> = {
  dark: "Dark",
  light: "Light",
  green: "Green",
  gradient: "Gradient",
};

const POSITION_LABELS: Record<PageHeaderPosition, string> = {
  center: "Center",
  center_top: "Center Top",
  center_bottom: "Center Bottom",
  left: "Left",
  right: "Right",
};

const HEIGHT_LABELS: Record<PageHeaderHeightPreset, string> = {
  compact: "Compact (260–400px)",
  standard: "Standard (300–450px)",
  tall: "Tall (340–500px)",
};

const selectClassName = "w-full rounded-field border border-neutral-300 px-3 py-2 text-body";

export default function PageHeaderEditorPage() {
  const params = useParams<{ pageKey: string }>();
  const pageKey = params.pageKey;
  const isGlobal = pageKey === GLOBAL_DEFAULT_PAGE_HEADER_KEY;

  const [row, setRow] = useState<PageHeader | null>(null);
  const [globalResolved, setGlobalResolved] = useState<ResolvedPageHeader | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [resetOpen, setResetOpen] = useState(false);
  const saveState = useSaveState();
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [rowData, globalData] = await Promise.all([
        adminApi.get<PageHeader>(`/admin/page-headers/${pageKey}`),
        isGlobal ? Promise.resolve(null) : adminApi.get<ResolvedPageHeader>(`/page-headers/${GLOBAL_DEFAULT_PAGE_HEADER_KEY}`),
      ]);
      setRow(rowData);
      setGlobalResolved(globalData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [pageKey, isGlobal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-route-change; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  if (status === "error") {
    return <AdminLoadError message="Gagal memuat Inner Page Header." onRetry={() => void load()} />;
  }
  if (status === "loading" || !row) {
    return <p className="text-body text-neutral-600">Memuat...</p>;
  }

  function patch(update: Partial<PageHeader>) {
    setRow((prev) => (prev ? { ...prev, ...update } : prev));
  }

  /** Mirrors the `translations` merge every other Admin editor's LocaleTabs block builds
   * client-side (e.g. FacilitiesEditor's `handleUpdateTranslation`) — spreads the existing
   * per-locale object so editing one locale/field never drops another already-entered one. */
  function patchTranslation(
    locale: Exclude<Locale, "en">,
    field: "customTitle" | "subtitle",
    value: string,
  ) {
    setRow((prev) => {
      if (!prev) return prev;
      const current = prev.translations ?? {};
      return {
        ...prev,
        translations: { ...current, [locale]: { ...current[locale], [field]: value } },
      };
    });
  }

  // Server already deep-merged and persisted `generated` into the DB (see
  // PageHeaderService.generateTranslations()) — this just reflects it into the open editor
  // session, same shallow-merge-per-locale contract as the Products pilot.
  function mergeGeneratedTranslations(generated: Translations) {
    setRow((prev) => (prev ? { ...prev, translations: { ...prev.translations, ...generated } } : prev));
  }

  async function handleSave() {
    if (!row) return;
    const result = await saveState.run(() =>
      adminApi.put<PageHeader>(`/admin/page-headers/${pageKey}`, {
        is_active: row.is_active,
        background_image_id: row.background_image?.id ?? null,
        mobile_background_image_id: row.mobile_background_image?.id ?? null,
        alt_text: row.alt_text,
        custom_title: row.custom_title,
        subtitle: row.subtitle,
        translations: row.translations,
        overlay_enabled: row.overlay_enabled,
        overlay_type: row.overlay_type,
        overlay_opacity: row.overlay_opacity,
        background_position: row.background_position,
        mobile_background_position: row.mobile_background_position,
        height_preset: row.height_preset,
        title_color: row.title_color,
        subtitle_color: row.subtitle_color,
        breadcrumb_color: row.breadcrumb_color,
        show_breadcrumb: row.show_breadcrumb,
      }),
    );
    if (result.success) {
      setRow(result.value);
      showToast("Perubahan tersimpan.");
    }
  }

  async function handleReset() {
    setResetOpen(false);
    try {
      const updated = await adminApi.put<PageHeader>(`/admin/page-headers/${pageKey}/reset`, {});
      setRow(updated);
      showToast("Header halaman ini dikembalikan ke Global Default.");
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Gagal mereset.", "error");
    }
  }

  const previewConfig = buildPreviewConfig(row, isGlobal ? null : globalResolved);
  const label = pageHeaderLabel(pageKey);

  return (
    <div className="pb-16">
      <Link
        href="/admin/pengaturan/page-header"
        className="text-small text-neutral-600 underline underline-offset-2"
      >
        ← Kembali ke Inner Page Header
      </Link>
      <h1 className="mt-2 text-h2 text-neutral-900">
        Inner Page Header
        <span className="ml-2 text-neutral-400">/</span>{" "}
        <span className="text-primary-700">{label}</span>
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.1fr] xl:items-start">
        {/* ── Settings ── */}
        <div className="flex flex-col gap-6">
          {!isGlobal && (
            <Card>
              <label className="flex items-center gap-2 text-body font-medium text-neutral-900">
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(e) => patch({ is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                Active
              </label>
              <p className="mt-1 text-small text-neutral-500">
                Jika dimatikan, halaman ini akan memakai Global Default Header sepenuhnya.
              </p>
            </Card>
          )}

          {pageKey === "product-detail" && (
            <p className="text-small text-neutral-500">
              Halaman ini dipakai bersama oleh semua produk — judul dan subtitle selalu memakai
              nama &amp; deskripsi produk yang sebenarnya dan tidak bisa diganti di sini.
              Background, overlay, posisi, tinggi, dan warna berlaku untuk semua produk.
            </p>
          )}

          <Card>
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
              Background Image
            </p>
            <div className="mt-3 flex flex-col gap-5">
              <BackgroundImageUpload
                label="Desktop Background"
                media={row.background_image}
                onChange={(media: Media) => patch({ background_image: media })}
                onRemove={() => patch({ background_image: null })}
              />
              <BackgroundImageUpload
                label="Mobile Background (optional — falls back to Desktop Background)"
                media={row.mobile_background_image}
                onChange={(media: Media) => patch({ mobile_background_image: media })}
                onRemove={() => patch({ mobile_background_image: null })}
              />
              <div>
                <Label htmlFor="alt-text">Background Image Alt Text</Label>
                <Input
                  id="alt-text"
                  value={row.alt_text ?? ""}
                  onChange={(e) => patch({ alt_text: e.target.value || null })}
                  placeholder={`Default: "${label}"`}
                />
              </div>
            </div>
          </Card>

          {!isGlobal && pageKey !== "product-detail" && (
            <Card>
              <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
                Title & Subtitle
              </p>
              <p className="mt-1 text-small text-neutral-500">
                English is the default shown to any locale without its own translation below —
                fill in only the languages you want to differ.
              </p>
              <div className="mt-3">
                <GenerateTranslationsPanel
                  statusUrl={`/admin/page-headers/${pageKey}/translation-status`}
                  generateUrl={`/admin/page-headers/${pageKey}/translations/generate`}
                  onGenerated={mergeGeneratedTranslations}
                />
                <LocaleTabs>
                  {(locale) => {
                    const isEn = locale === "en";
                    const titleValue = isEn
                      ? (row.custom_title ?? "")
                      : (row.translations?.[locale]?.customTitle ?? "");
                    const subtitleValue = isEn
                      ? (row.subtitle ?? "")
                      : (row.translations?.[locale]?.subtitle ?? "");
                    return (
                      <div className="flex flex-col gap-4">
                        <div>
                          <Label htmlFor={`custom-title-${locale}`}>Custom Page Title (optional)</Label>
                          <Input
                            id={`custom-title-${locale}`}
                            value={titleValue}
                            onChange={(e) =>
                              isEn
                                ? patch({ custom_title: e.target.value || null })
                                : patchTranslation(locale, "customTitle", e.target.value)
                            }
                            placeholder={`Default: "${label}"`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`subtitle-${locale}`}>Subtitle (optional)</Label>
                          <Textarea
                            id={`subtitle-${locale}`}
                            rows={2}
                            value={subtitleValue}
                            onChange={(e) =>
                              isEn
                                ? patch({ subtitle: e.target.value || null })
                                : patchTranslation(locale, "subtitle", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  }}
                </LocaleTabs>
              </div>
            </Card>
          )}

          <Card>
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Overlay</p>
            <div className="mt-3 flex flex-col gap-4">
              <label className="flex items-center gap-2 text-small text-neutral-700">
                <input
                  type="checkbox"
                  checked={row.overlay_enabled ?? SYSTEM_DEFAULTS.overlay_enabled}
                  onChange={(e) => patch({ overlay_enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Enable Overlay
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="overlay-type">Overlay Type</Label>
                  <select
                    id="overlay-type"
                    value={row.overlay_type ?? SYSTEM_DEFAULTS.overlay_type}
                    onChange={(e) => patch({ overlay_type: e.target.value as PageHeaderOverlayType })}
                    className={selectClassName}
                  >
                    {PAGE_HEADER_OVERLAY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {OVERLAY_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="overlay-opacity">Opacity ({row.overlay_opacity ?? SYSTEM_DEFAULTS.overlay_opacity}%)</Label>
                  <input
                    id="overlay-opacity"
                    type="range"
                    min={0}
                    max={100}
                    value={row.overlay_opacity ?? SYSTEM_DEFAULTS.overlay_opacity}
                    onChange={(e) => patch({ overlay_opacity: Number(e.target.value) })}
                    className="mt-2 w-full"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
              Position & Height
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bg-position">Background Position (Desktop)</Label>
                <select
                  id="bg-position"
                  value={row.background_position ?? SYSTEM_DEFAULTS.background_position}
                  onChange={(e) => patch({ background_position: e.target.value as PageHeaderPosition })}
                  className={selectClassName}
                >
                  {PAGE_HEADER_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {POSITION_LABELS[pos]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bg-position-mobile">Background Position (Mobile)</Label>
                <select
                  id="bg-position-mobile"
                  value={row.mobile_background_position ?? row.background_position ?? SYSTEM_DEFAULTS.mobile_background_position}
                  onChange={(e) => patch({ mobile_background_position: e.target.value as PageHeaderPosition })}
                  className={selectClassName}
                >
                  {PAGE_HEADER_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {POSITION_LABELS[pos]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="height-preset">Header Height</Label>
                <select
                  id="height-preset"
                  value={row.height_preset ?? SYSTEM_DEFAULTS.height_preset}
                  onChange={(e) => patch({ height_preset: e.target.value as PageHeaderHeightPreset })}
                  className={selectClassName}
                >
                  {PAGE_HEADER_HEIGHT_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {HEIGHT_LABELS[preset]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Colors</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ColorPickerField
                label="Title Color"
                value={row.title_color ?? SYSTEM_DEFAULTS.title_color}
                onChange={(value) => patch({ title_color: value })}
              />
              <ColorPickerField
                label="Subtitle Color"
                value={row.subtitle_color ?? SYSTEM_DEFAULTS.subtitle_color}
                onChange={(value) => patch({ subtitle_color: value })}
              />
              <ColorPickerField
                label="Breadcrumb Color"
                value={row.breadcrumb_color ?? SYSTEM_DEFAULTS.breadcrumb_color}
                onChange={(value) => patch({ breadcrumb_color: value })}
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-small text-neutral-700">
              <input
                type="checkbox"
                checked={row.show_breadcrumb ?? SYSTEM_DEFAULTS.show_breadcrumb}
                onChange={(e) => patch({ show_breadcrumb: e.target.checked })}
                className="h-4 w-4"
              />
              Show Breadcrumb
            </label>
          </Card>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveState.status === "saving"}
              className="rounded-button bg-primary-500 px-6 py-2.5 text-small font-semibold text-neutral-900 hover:bg-primary-600 disabled:opacity-50"
            >
              {saveState.status === "saving" ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="rounded-button border border-neutral-300 px-6 py-2.5 text-small font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Reset
            </button>
            {saveState.status === "saved" && <span className="text-small text-primary-700">Tersimpan.</span>}
            {saveState.status === "error" && <span className="text-small text-red-600">{saveState.error}</span>}
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="xl:sticky xl:top-6">
          <p className="mb-2 text-small font-semibold uppercase tracking-wide text-neutral-500">
            Live Preview
          </p>
          <div className="overflow-hidden rounded-card border border-neutral-200">
            <PageHeaderPreview
              breadcrumb={[{ label: "Home", href: "/" }, { label: label }]}
              title={label}
              config={previewConfig}
              animateBackground={false}
              priority={false}
            />
          </div>
        </div>
      </div>

      {resetOpen && (
        <ConfirmDialog
          title="Reset header halaman ini?"
          message="Konfigurasi khusus halaman ini (background, judul, warna, dll.) akan dihapus dan halaman ini akan kembali memakai Global Default Header. Halaman lain tidak terpengaruh."
          confirmLabel="Reset"
          onConfirm={() => void handleReset()}
          onCancel={() => setResetOpen(false)}
        />
      )}
    </div>
  );
}

/** Mirrors the backend's `resolvePageHeader()` field-by-field so the Live Preview always shows
 * exactly what the public page would render with these same pending edits — including edits
 * not yet saved. `global` is `null` while editing the Global Default row itself, so its own
 * unset fields fall straight through to the hardcoded system constants. */
function buildPreviewConfig(row: PageHeader, global: ResolvedPageHeader | null): ResolvedPageHeader {
  const backgroundImage = row.background_image ?? global?.background_image ?? null;
  const mobileBackgroundImage = row.mobile_background_image ?? global?.mobile_background_image ?? backgroundImage;
  return {
    background_image: backgroundImage,
    mobile_background_image: mobileBackgroundImage,
    alt_text: row.alt_text ?? global?.alt_text ?? null,
    custom_title: row.custom_title ?? null,
    subtitle: row.subtitle ?? global?.subtitle ?? null,
    overlay_enabled: row.overlay_enabled ?? global?.overlay_enabled ?? SYSTEM_DEFAULTS.overlay_enabled,
    overlay_type: row.overlay_type ?? global?.overlay_type ?? SYSTEM_DEFAULTS.overlay_type,
    overlay_opacity: row.overlay_opacity ?? global?.overlay_opacity ?? SYSTEM_DEFAULTS.overlay_opacity,
    background_position: row.background_position ?? global?.background_position ?? SYSTEM_DEFAULTS.background_position,
    mobile_background_position:
      row.mobile_background_position ??
      row.background_position ??
      global?.mobile_background_position ??
      SYSTEM_DEFAULTS.mobile_background_position,
    height_preset: row.height_preset ?? global?.height_preset ?? SYSTEM_DEFAULTS.height_preset,
    title_color: row.title_color ?? global?.title_color ?? SYSTEM_DEFAULTS.title_color,
    subtitle_color: row.subtitle_color ?? global?.subtitle_color ?? SYSTEM_DEFAULTS.subtitle_color,
    breadcrumb_color: row.breadcrumb_color ?? global?.breadcrumb_color ?? SYSTEM_DEFAULTS.breadcrumb_color,
    show_breadcrumb: row.show_breadcrumb ?? global?.show_breadcrumb ?? SYSTEM_DEFAULTS.show_breadcrumb,
  };
}
