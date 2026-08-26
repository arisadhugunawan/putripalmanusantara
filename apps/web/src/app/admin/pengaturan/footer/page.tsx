"use client";

import { Card, Input, Label, Textarea } from "@ppn/ui-components";
import {
  FOOTER_OVERLAY_TYPES,
  PAGE_HEADER_POSITIONS,
  type FooterOverlayType,
  type FooterSettings,
  type Locale,
  type Media,
  type PageHeaderPosition,
  type Translations,
} from "@ppn/shared-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { BackgroundImageUpload } from "@/components/admin/BackgroundImageUpload";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";

const OVERLAY_LABELS: Record<FooterOverlayType, string> = {
  dark_green: "Dark Green",
  charcoal: "Charcoal",
  black: "Black",
  green_gradient: "Green Gradient",
};

const POSITION_LABELS: Record<PageHeaderPosition, string> = {
  center: "Center",
  center_top: "Center Top",
  center_bottom: "Center Bottom",
  left: "Left",
  right: "Right",
};

const selectClassName = "w-full rounded-field border border-neutral-300 px-3 py-2 text-body";

export default function FooterManagementPage() {
  const [row, setRow] = useState<FooterSettings | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const saveState = useSaveState();
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await adminApi.get<FooterSettings>("/admin/footer");
      setRow(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  if (status === "error") {
    return <AdminLoadError message="Gagal memuat Footer Management." onRetry={() => void load()} />;
  }
  if (status === "loading" || !row) {
    return <p className="text-body text-neutral-600">Memuat...</p>;
  }

  function patch(update: Partial<FooterSettings>) {
    setRow((prev) => (prev ? { ...prev, ...update } : prev));
  }

  /** Mirrors the `translations` merge every other Admin editor's LocaleTabs block builds
   * client-side (e.g. FacilitiesEditor's `handleUpdateTranslation`, PageHeader's
   * `patchTranslation`) — spreads the existing per-locale object so editing one locale/field
   * never drops another already-entered one. */
  function patchTranslation(
    locale: Exclude<Locale, "en">,
    field:
      | "tagline"
      | "description"
      | "ctaHeadline"
      | "ctaDescription"
      | "ctaPrimaryText"
      | "ctaSecondaryText",
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
  // FooterService.generateTranslations()) — this just reflects it into the open editor
  // session, same shallow-merge-per-locale contract as the Products pilot.
  function mergeGeneratedTranslations(generated: Translations) {
    setRow((prev) => (prev ? { ...prev, translations: { ...prev.translations, ...generated } } : prev));
  }

  async function handleSave() {
    if (!row) return;
    const result = await saveState.run(() =>
      adminApi.put<FooterSettings>("/admin/footer", {
        enabled: row.enabled,
        show_cta: row.show_cta,
        show_social: row.show_social,
        show_contact: row.show_contact,
        show_navigation: row.show_navigation,
        company_name: row.company_name,
        tagline: row.tagline,
        description: row.description,
        translations: row.translations,
        background_image_id: row.background_image?.id ?? null,
        mobile_background_image_id: row.mobile_background_image?.id ?? null,
        background_alt_text: row.background_alt_text,
        overlay_type: row.overlay_type,
        overlay_opacity: row.overlay_opacity,
        background_position: row.background_position,
        mobile_background_position: row.mobile_background_position,
        cta_headline: row.cta_headline,
        cta_description: row.cta_description,
        cta_primary_text: row.cta_primary_text,
        cta_secondary_text: row.cta_secondary_text,
      }),
    );
    if (result.success) {
      setRow(result.value);
      showToast("Perubahan tersimpan.");
    }
  }

  return (
    <div className="max-w-3xl pb-16">
      <Link href="/admin/pengaturan" className="text-small text-neutral-600 underline underline-offset-2">
        ← Kembali ke Pengaturan
      </Link>
      <h1 className="mt-2 text-h2 text-neutral-900">Footer Management</h1>
      <p className="mt-2 text-body text-neutral-600">
        Kelola background, CTA, dan tampilan footer di seluruh halaman public. Informasi kontak,
        jam operasional, lokasi kantor, dan social media diambil langsung dari{" "}
        <Link href="/admin/pengaturan/kontak" className="text-primary-700 underline">
          Contact Page
        </Link>{" "}
        — kelola di sana agar tidak ada dua sumber data yang bisa berbeda.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">General</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ["enabled", "Footer Enabled"],
                ["show_cta", "Show CTA Banner"],
                ["show_social", "Show Social Media"],
                ["show_contact", "Show Contact"],
                ["show_navigation", "Show Navigation"],
              ] as const
            ).map(([key, toggleLabel]) => (
              <label key={key} className="flex items-center gap-2 text-small text-neutral-700">
                <input
                  type="checkbox"
                  checked={row[key]}
                  onChange={(e) => patch({ [key]: e.target.checked })}
                  className="h-4 w-4"
                />
                {toggleLabel}
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Branding</p>
          <p className="mt-1 text-small text-neutral-500">
            Logo diatur di{" "}
            <Link href="/admin/pengaturan/brand-logo" className="text-primary-700 underline">
              Brand &amp; Logo
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={row.company_name}
                onChange={(e) => patch({ company_name: e.target.value })}
              />
            </div>
            <div>
              <p className="text-small font-medium text-neutral-700">Headline &amp; Description</p>
              <p className="mt-1 text-small text-neutral-500">
                English is the default shown to any locale without its own translation below —
                fill in only the languages you want to differ.
              </p>
              <div className="mt-3">
                <GenerateTranslationsPanel
                  statusUrl="/admin/footer/translation-status"
                  generateUrl="/admin/footer/translations/generate"
                  onGenerated={mergeGeneratedTranslations}
                />
                <LocaleTabs>
                  {(locale) => {
                    const isEn = locale === "en";
                    const taglineValue = isEn
                      ? row.tagline
                      : (row.translations?.[locale]?.tagline ?? "");
                    const descriptionValue = isEn
                      ? row.description
                      : (row.translations?.[locale]?.description ?? "");
                    return (
                      <div className="flex flex-col gap-4">
                        <div>
                          <Label htmlFor={`tagline-${locale}`}>Headline</Label>
                          <Input
                            id={`tagline-${locale}`}
                            value={taglineValue}
                            onChange={(e) =>
                              isEn
                                ? patch({ tagline: e.target.value })
                                : patchTranslation(locale, "tagline", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`description-${locale}`}>Description</Label>
                          <Textarea
                            id={`description-${locale}`}
                            rows={3}
                            value={descriptionValue}
                            onChange={(e) =>
                              isEn
                                ? patch({ description: e.target.value })
                                : patchTranslation(locale, "description", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  }}
                </LocaleTabs>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
            Call to Action
          </p>
          <p className="mt-1 text-small text-neutral-500">
            The banner shown above the footer columns. Primary button always links to Products;
            secondary button always opens WhatsApp (configured on the{" "}
            <Link href="/admin/pengaturan/kontak" className="text-primary-700 underline">
              Contact Page
            </Link>
            ) — hidden automatically if no WhatsApp number is set there.
          </p>
          <div className="mt-3">
            <LocaleTabs>
              {(locale) => {
                const isEn = locale === "en";
                const headlineValue = isEn
                  ? row.cta_headline
                  : (row.translations?.[locale]?.ctaHeadline ?? "");
                const descriptionValue = isEn
                  ? row.cta_description
                  : (row.translations?.[locale]?.ctaDescription ?? "");
                const primaryValue = isEn
                  ? row.cta_primary_text
                  : (row.translations?.[locale]?.ctaPrimaryText ?? "");
                const secondaryValue = isEn
                  ? row.cta_secondary_text
                  : (row.translations?.[locale]?.ctaSecondaryText ?? "");
                return (
                  <div className="flex flex-col gap-4">
                    <div>
                      <Label htmlFor={`cta-headline-${locale}`}>Headline</Label>
                      <Input
                        id={`cta-headline-${locale}`}
                        value={headlineValue}
                        onChange={(e) =>
                          isEn
                            ? patch({ cta_headline: e.target.value })
                            : patchTranslation(locale, "ctaHeadline", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cta-description-${locale}`}>Description</Label>
                      <Textarea
                        id={`cta-description-${locale}`}
                        rows={2}
                        value={descriptionValue}
                        onChange={(e) =>
                          isEn
                            ? patch({ cta_description: e.target.value })
                            : patchTranslation(locale, "ctaDescription", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`cta-primary-${locale}`}>Primary Button Label</Label>
                        <Input
                          id={`cta-primary-${locale}`}
                          value={primaryValue}
                          onChange={(e) =>
                            isEn
                              ? patch({ cta_primary_text: e.target.value })
                              : patchTranslation(locale, "ctaPrimaryText", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cta-secondary-${locale}`}>Secondary Button Label</Label>
                        <Input
                          id={`cta-secondary-${locale}`}
                          value={secondaryValue}
                          onChange={(e) =>
                            isEn
                              ? patch({ cta_secondary_text: e.target.value })
                              : patchTranslation(locale, "ctaSecondaryText", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              }}
            </LocaleTabs>
          </div>
        </Card>

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
              uploadUrl="/admin/footer/upload"
              recommendedWidth={1920}
              recommendedHeight={700}
              minWidth={1600}
              minHeight={500}
              defaultAltText="Footer background"
            />
            <BackgroundImageUpload
              label="Mobile Background (optional — falls back to Desktop Background)"
              media={row.mobile_background_image}
              onChange={(media: Media) => patch({ mobile_background_image: media })}
              onRemove={() => patch({ mobile_background_image: null })}
              uploadUrl="/admin/footer/upload"
              recommendedWidth={1080}
              recommendedHeight={900}
              minWidth={768}
              minHeight={700}
              defaultAltText="Footer background"
            />
            <div>
              <Label htmlFor="bg-alt">Background Image Alt Text</Label>
              <Input
                id="bg-alt"
                value={row.background_alt_text ?? ""}
                onChange={(e) => patch({ background_alt_text: e.target.value || null })}
                placeholder={`Default: "${row.company_name}"`}
              />
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
            Background Effect
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overlay-type">Overlay Type</Label>
                <select
                  id="overlay-type"
                  value={row.overlay_type}
                  onChange={(e) => patch({ overlay_type: e.target.value as FooterOverlayType })}
                  className={selectClassName}
                >
                  {FOOTER_OVERLAY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {OVERLAY_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="overlay-opacity">Opacity ({row.overlay_opacity}%)</Label>
                <input
                  id="overlay-opacity"
                  type="range"
                  min={0}
                  max={100}
                  value={row.overlay_opacity}
                  onChange={(e) => patch({ overlay_opacity: Number(e.target.value) })}
                  className="mt-2 w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bg-position">Position (Desktop)</Label>
                <select
                  id="bg-position"
                  value={row.background_position}
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
                <Label htmlFor="bg-position-mobile">Position (Mobile)</Label>
                <select
                  id="bg-position-mobile"
                  value={row.mobile_background_position}
                  onChange={(e) =>
                    patch({ mobile_background_position: e.target.value as PageHeaderPosition })
                  }
                  className={selectClassName}
                >
                  {PAGE_HEADER_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {POSITION_LABELS[pos]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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
          {saveState.status === "saved" && <span className="text-small text-primary-700">Tersimpan.</span>}
          {saveState.status === "error" && <span className="text-small text-red-600">{saveState.error}</span>}
        </div>
      </div>
    </div>
  );
}
