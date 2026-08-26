"use client";

import { LOCALE_LABELS } from "@ppn/shared-types";
import type {
  GenerateTranslationsResult,
  Translations,
  TranslationStatusEntry,
} from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { Button } from "@ppn/ui-components";
import { useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { AdminLoadError } from "./AdminLoadError";
import { ConfirmDialog } from "./ConfirmDialog";
import { useAdminResource } from "@/hooks/useAdminResource";

const TRANSLATION_STATUS_LABELS: Record<TranslationStatusEntry["status"], string> = {
  translated: "Diterjemahkan",
  partial: "Sebagian",
  not_translated: "Belum Diterjemahkan",
};

const TRANSLATION_STATUS_STYLES: Record<TranslationStatusEntry["status"], string> = {
  translated: "bg-primary-100 text-primary-700",
  partial: "bg-secondary-500/20 text-neutral-900",
  not_translated: "bg-neutral-100 text-neutral-600",
};

/** Translation coverage at a glance (brief §14 "Translation Status") — computed live from
 * whether the `translations` JSON actually has real text per locale, not a stored flag that
 * could drift out of sync. "Generate Translations" calls an AI-assisted translator (built on
 * the same AiProvider abstraction as the public chat assistant — see `AiTranslationService`),
 * which degrades honestly to a "not configured" message if no AI provider has an API key set,
 * instead of faking a result. A successful generate OVERWRITES all 5 non-English tabs with
 * fresh AI output via `onGenerated` — same intent as clicking the button: get new
 * translations, not a partial merge with whatever was there before.
 *
 * Generic across every translatable resource — pass the resource's own status/generate URLs
 * (singletons have no `:id` segment, collection items do) rather than assuming a shape. */
export function GenerateTranslationsPanel({
  statusUrl,
  generateUrl,
  onGenerated,
}: {
  statusUrl: string;
  generateUrl: string;
  onGenerated: (generated: Translations) => void;
}) {
  const fetchStatus = useCallback(
    () => adminApi.get<TranslationStatusEntry[]>(statusUrl),
    [statusUrl],
  );
  const { data: entries, status: loadStatus, reload, retry } = useAdminResource(fetchStatus);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);

  async function handleGenerate() {
    setConfirmingGenerate(false);
    setGenerating(true);
    setGenerateMessage(null);
    try {
      const result = await adminApi.post<GenerateTranslationsResult>(generateUrl);
      setGenerateMessage(result.message);
      if (result.available) onGenerated(result.translations);
      await reload();
    } catch (err) {
      setGenerateMessage(err instanceof ApiRequestError ? err.message : "Gagal memeriksa status terjemahan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-field border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-body font-medium text-neutral-900">Status Terjemahan</h3>
          <p className="text-small text-neutral-600">
            Bahasa tanpa terjemahan otomatis menampilkan teks Inggris sebagai cadangan — isi tab bahasa di
            bawah untuk mengubahnya, atau gunakan Generate Translations untuk mengisi otomatis dengan AI.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={generating} onClick={() => setConfirmingGenerate(true)}>
          {generating ? "Menerjemahkan..." : "Generate Translations"}
        </Button>
      </div>

      {confirmingGenerate && (
        <ConfirmDialog
          title="Generate Translations?"
          message="Ini akan MENIMPA isi ke-5 tab bahasa (selain Inggris) dengan hasil terjemahan AI baru, termasuk suntingan manual yang belum disimpan di tab-tab tersebut."
          confirmLabel="Generate"
          onConfirm={() => void handleGenerate()}
          onCancel={() => setConfirmingGenerate(false)}
        />
      )}

      {generateMessage && (
        <p className="mt-3 rounded-field bg-white p-3 text-small text-neutral-700">{generateMessage}</p>
      )}

      {loadStatus === "error" && <AdminLoadError message="Gagal memuat status terjemahan." onRetry={() => void retry()} />}
      {loadStatus === "loading" && <p className="mt-3 text-small text-neutral-500">Memuat...</p>}
      {loadStatus === "ready" && entries && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.map((entry) => (
            <span
              key={entry.locale}
              className={cn(
                "rounded-full px-3 py-1 text-small font-medium",
                TRANSLATION_STATUS_STYLES[entry.status],
              )}
            >
              {LOCALE_LABELS[entry.locale as keyof typeof LOCALE_LABELS]?.name ?? entry.locale.toUpperCase()} ·{" "}
              {TRANSLATION_STATUS_LABELS[entry.status]}
              {entry.status === "partial" && ` (${entry.fields_translated}/${entry.fields_total})`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
