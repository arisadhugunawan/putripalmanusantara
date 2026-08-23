"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import type { ContactLocation, ContactPageSettings, ContactPagePublishStatus, Locale } from "@ppn/shared-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useSaveState } from "@/hooks/useSaveState";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { PublishContactPageButton } from "@/components/admin/PublishContactPageButton";
import { SaveStateIndicator } from "@/components/admin/SaveStateIndicator";
import { useToast } from "@/components/admin/Toast";
import { LocationsEditor } from "./LocationsEditor";
import { SocialLinksEditor } from "./SocialLinksEditor";

/** Matches the camelCase (Prisma) field names `resolveContactPageSettingsLocale()` on the
 * backend resolves `translations` against — see `contact-page.mapper.ts`. */
type TranslatableField =
  | "heroEyebrow"
  | "heroHeading"
  | "heroDescription"
  | "whatsappMessageGreeting"
  | "whatsappMessageIntro"
  | "whatsappMessageProductListLabel"
  | "whatsappMessageClosing";

const WEEKDAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

interface KontakData {
  settings: ContactPageSettings;
  locations: ContactLocation[];
  publishStatus: ContactPagePublishStatus;
}

/**
 * Admin → Pengaturan → Kontak — full Contact Page CMS (brief items 18-24): Contact
 * Information, Business Hours, Locations, Google Maps (main map picker), Social Media, Hero,
 * with a Draft/Publish/Unpublish workflow separate from the generic Settings page. Saving a
 * field here only ever touches the draft `ContactPageSettings`/`ContactLocation` tables — the
 * public `/contact` page keeps rendering whatever was last Published until an admin explicitly
 * clicks Publish, exactly like Homepage Manager / About Company Manager.
 */
export default function AdminContactPage() {
  const fetchData = useCallback(async (): Promise<KontakData> => {
    const [settings, locations, publishStatus] = await Promise.all([
      adminApi.get<ContactPageSettings>("/admin/contact-page/settings"),
      adminApi.get<ContactLocation[]>("/admin/contact-page/locations"),
      adminApi.get<ContactPagePublishStatus>("/admin/contact-page/publish-status"),
    ]);
    return { settings, locations, publishStatus };
  }, []);

  const { data, status: loadStatus, reload, retry } = useAdminResource(fetchData);
  const [form, setForm] = useState<ContactPageSettings | null>(null);
  const { status: saveStatus, error: saveError, run } = useSaveState();
  const { showToast } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from a freshly (re)loaded server record, standard pattern used across every other Admin editor in this project
    if (data && !form) setForm(data.settings);
  }, [data, form]);

  /** Mirrors the `translations` merge every other Admin editor's LocaleTabs block builds
   * client-side (e.g. Footer's `patchTranslation`) — spreads the existing per-locale object so
   * editing one locale/field never drops another already-entered one. */
  function patchTranslation(locale: Exclude<Locale, "en">, field: TranslatableField, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const current = prev.translations ?? {};
      return {
        ...prev,
        translations: { ...current, [locale]: { ...current[locale], [field]: value } },
      };
    });
  }

  async function handleSaveDraft() {
    if (!form) return;
    const result = await run(() =>
      adminApi.put<ContactPageSettings>("/admin/contact-page/settings", {
        email: form.email,
        whatsapp_number: form.whatsapp_number,
        business_hours_open_days: form.business_hours_open_days,
        business_hours_open_time: form.business_hours_open_time,
        business_hours_close_time: form.business_hours_close_time,
        business_hours_utc_offset: form.business_hours_utc_offset,
        hero_eyebrow: form.hero_eyebrow,
        hero_heading: form.hero_heading,
        hero_description: form.hero_description,
        hero_image_id: form.hero_image?.id ?? null,
        hero_overlay_opacity: form.hero_overlay_opacity,
        hero_cta_primary_text: form.hero_cta_primary_text,
        hero_cta_secondary_text: form.hero_cta_secondary_text,
        buyer_cta_heading: form.buyer_cta_heading,
        buyer_cta_description: form.buyer_cta_description,
        buyer_cta_button_text: form.buyer_cta_button_text,
        supplier_cta_heading: form.supplier_cta_heading,
        supplier_cta_description: form.supplier_cta_description,
        supplier_cta_button_text: form.supplier_cta_button_text,
        supplier_cta_whatsapp_message: form.supplier_cta_whatsapp_message,
        whatsapp_message_greeting: form.whatsapp_message_greeting,
        whatsapp_message_intro: form.whatsapp_message_intro,
        whatsapp_message_product_list_label: form.whatsapp_message_product_list_label,
        whatsapp_message_closing: form.whatsapp_message_closing,
        main_map_location_id: form.main_map_location_id,
        translations: form.translations,
      }),
    );
    if (result.success) {
      setForm(result.value);
      await reload();
    } else {
      showToast("Changes could not be saved. Please try again.", "error");
    }
  }

  function toggleDay(day: string) {
    if (!form) return;
    const has = form.business_hours_open_days.includes(day);
    setForm({
      ...form,
      business_hours_open_days: has
        ? form.business_hours_open_days.filter((d) => d !== day)
        : [...form.business_hours_open_days, day],
    });
  }

  if (loadStatus === "error") {
    return (
      <div className="max-w-4xl">
        <h1 className="text-h2 text-neutral-900">Contact Page</h1>
        <AdminLoadError onRetry={() => void retry()} />
      </div>
    );
  }

  if (loadStatus === "loading" || !data || !form) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-h2 text-neutral-900">Contact Page</h1>
        <p className="mt-4 text-body text-neutral-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-16">
      <Link href="/admin/pengaturan" className="text-small text-neutral-600 underline underline-offset-2">
        ← Back to Pengaturan
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-neutral-900">Contact Page</h1>
          <p className="mt-1 text-body text-neutral-600">
            Contact information, business hours, locations, Google Maps, social media, and hero
            content shown on the public Contact page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/preview/kontak"
            target="_blank"
            rel="noopener noreferrer"
            className="text-small font-medium text-primary-700 underline"
          >
            Preview Page
          </a>
          <PublishContactPageButton isPublished={data.publishStatus.is_published} onChanged={() => void reload()} />
        </div>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-small text-neutral-600">
          <span>
            Status:{" "}
            <strong className="text-neutral-900">{data.publishStatus.is_published ? "Published" : "Not published"}</strong>
          </span>
          <span>
            Last Published:{" "}
            <strong className="text-neutral-900">
              {data.publishStatus.last_published_at ? new Date(data.publishStatus.last_published_at).toLocaleString() : "Never"}
            </strong>
          </span>
          {data.publishStatus.has_unpublished_changes && (
            <span className="inline-flex items-center rounded-button bg-amber-100 px-2.5 py-0.5 font-medium text-amber-900">
              ● Unpublished changes
            </span>
          )}
        </div>
      </Card>

      {!data.publishStatus.is_published && (
        <div className="mt-4 rounded-card border border-amber-300 bg-amber-50 p-4" role="status">
          <p className="text-body font-medium text-amber-900">The Contact page has not been published yet.</p>
          <p className="mt-1 text-small text-amber-900">
            Until it is, <code>/contact</code> shows a &ldquo;being updated&rdquo; placeholder to visitors instead of
            draft content. Press <strong>Publish</strong> above to make it live.
          </p>
        </div>
      )}

      {/* Contact Information */}
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Contact Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              placeholder="+62 822 9380 7717"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Business Hours */}
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Business Hours</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              aria-pressed={form.business_hours_open_days.includes(day.key)}
              className={`rounded-button border px-3 py-1.5 text-small transition-colors ${
                form.business_hours_open_days.includes(day.key)
                  ? "border-primary-600 bg-primary-100 text-primary-700"
                  : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="open-time">Open Time</Label>
            <Input
              id="open-time"
              type="time"
              value={form.business_hours_open_time}
              onChange={(e) => setForm({ ...form, business_hours_open_time: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="close-time">Close Time</Label>
            <Input
              id="close-time"
              type="time"
              value={form.business_hours_close_time}
              onChange={(e) => setForm({ ...form, business_hours_close_time: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="utc-offset">UTC Offset (e.g. 7 for GMT+7)</Label>
            <Input
              id="utc-offset"
              type="number"
              min={-12}
              max={14}
              value={form.business_hours_utc_offset}
              onChange={(e) => setForm({ ...form, business_hours_utc_offset: Number(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      {/* Google Maps — main location */}
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Google Maps</h2>
        <p className="mt-1 text-small text-neutral-600">Which location is shown as the main Contact map.</p>
        <div className="mt-4 max-w-sm">
          <Label htmlFor="main-map">Main Map Location</Label>
          <select
            id="main-map"
            value={form.main_map_location_id ?? ""}
            onChange={(e) => setForm({ ...form, main_map_location_id: e.target.value || null })}
            className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
          >
            <option value="">— None —</option>
            {data.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* WhatsApp Message Template */}
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">WhatsApp Message Template</h2>
        <p className="mt-1 text-small text-neutral-600">
          Pesan yang terisi otomatis saat pengunjung mengklik tombol WhatsApp. Daftar produk selalu diambil dari
          katalog produk yang sedang aktif — tidak perlu diketik manual di sini. English is the default shown to
          any locale without its own translation below — fill in only the languages you want to differ.
        </p>
        <div className="mt-4">
          <LocaleTabs>
            {(locale) => {
              const isEn = locale === "en";
              const t = form.translations?.[locale];
              const greetingValue = isEn ? form.whatsapp_message_greeting : (t?.whatsappMessageGreeting ?? "");
              const introValue = isEn ? form.whatsapp_message_intro : (t?.whatsappMessageIntro ?? "");
              const productLabelValue = isEn
                ? form.whatsapp_message_product_list_label
                : (t?.whatsappMessageProductListLabel ?? "");
              const closingValue = isEn ? form.whatsapp_message_closing : (t?.whatsappMessageClosing ?? "");
              return (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor={`wa-greeting-${locale}`}>Greeting</Label>
                    <Input
                      id={`wa-greeting-${locale}`}
                      value={greetingValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, whatsapp_message_greeting: e.target.value })
                          : patchTranslation(locale, "whatsappMessageGreeting", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`wa-intro-${locale}`}>Message</Label>
                    <textarea
                      id={`wa-intro-${locale}`}
                      value={introValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, whatsapp_message_intro: e.target.value })
                          : patchTranslation(locale, "whatsappMessageIntro", e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`wa-product-label-${locale}`}>Product List Label</Label>
                    <Input
                      id={`wa-product-label-${locale}`}
                      value={productLabelValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, whatsapp_message_product_list_label: e.target.value })
                          : patchTranslation(locale, "whatsappMessageProductListLabel", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`wa-closing-${locale}`}>Closing</Label>
                    <textarea
                      id={`wa-closing-${locale}`}
                      value={closingValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, whatsapp_message_closing: e.target.value })
                          : patchTranslation(locale, "whatsappMessageClosing", e.target.value)
                      }
                      rows={2}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                    />
                  </div>
                </div>
              );
            }}
          </LocaleTabs>
        </div>
      </Card>

      <SocialLinksEditor />

      {/* Contact Hero */}
      <Card className="mt-6">
        <h2 className="text-h3 text-neutral-900">Contact Hero</h2>
        <p className="mt-1 text-small text-neutral-500">
          English is the default shown to any locale without its own translation below — fill in only the
          languages you want to differ.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <LocaleTabs>
            {(locale) => {
              const isEn = locale === "en";
              const t = form.translations?.[locale];
              const eyebrowValue = isEn ? form.hero_eyebrow : (t?.heroEyebrow ?? "");
              const headingValue = isEn ? form.hero_heading : (t?.heroHeading ?? "");
              const descriptionValue = isEn ? form.hero_description : (t?.heroDescription ?? "");
              return (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor={`hero-eyebrow-${locale}`}>Eyebrow</Label>
                    <Input
                      id={`hero-eyebrow-${locale}`}
                      value={eyebrowValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, hero_eyebrow: e.target.value })
                          : patchTranslation(locale, "heroEyebrow", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`hero-heading-${locale}`}>Heading</Label>
                    <Input
                      id={`hero-heading-${locale}`}
                      value={headingValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, hero_heading: e.target.value })
                          : patchTranslation(locale, "heroHeading", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`hero-description-${locale}`}>Description</Label>
                    <textarea
                      id={`hero-description-${locale}`}
                      value={descriptionValue}
                      onChange={(e) =>
                        isEn
                          ? setForm({ ...form, hero_description: e.target.value })
                          : patchTranslation(locale, "heroDescription", e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2 text-body"
                    />
                  </div>
                </div>
              );
            }}
          </LocaleTabs>
          <MediaUploadField
            label="Background Image (optional)"
            media={form.hero_image}
            onChange={(media) => setForm({ ...form, hero_image: media })}
            onRemove={() => setForm({ ...form, hero_image: null })}
            hint="Landscape photo, recommended 1920×480px (same size as the Product Detail page header background). A soft green-tinted overlay is applied automatically for text legibility."
          />
          <div className="max-w-sm">
            <Label htmlFor="overlay-opacity">Overlay Strength ({form.hero_overlay_opacity}%)</Label>
            <input
              id="overlay-opacity"
              type="range"
              min={0}
              max={100}
              value={form.hero_overlay_opacity}
              onChange={(e) => setForm({ ...form, hero_overlay_opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-4">
        <Button type="button" onClick={() => void handleSaveDraft()} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Saving..." : "Save Draft"}
        </Button>
        <SaveStateIndicator status={saveStatus} error={saveError} />
      </div>

      <LocationsEditor locations={data.locations} onChange={reload} />
    </div>
  );
}
