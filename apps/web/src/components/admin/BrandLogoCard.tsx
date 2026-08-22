"use client";

import { Button, Card, Input, Label, cn } from "@ppn/ui-components";
import type { Media } from "@ppn/shared-types";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { MediaUploadField } from "./MediaUploadField";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useToast } from "./Toast";
import { useSaveState } from "@/hooks/useSaveState";

const PREVIEW_BACKGROUNDS: Record<"light" | "dark" | "checker", string> = {
  light: "bg-white",
  dark: "bg-neutral-900",
  checker:
    "bg-[repeating-conic-gradient(#e7e9e5_0%_25%,white_0%_50%)] bg-[length:16px_16px]",
};

export interface BrandLogoCardProps {
  title: string;
  description: string;
  hint: string;
  media: Media | null;
  altText: string;
  defaultAltText: string;
  maxSizeBytes: number;
  /** Header/Footer: "Aktif" — whether this slot renders at all on the public site.
   * Mobile: "Gunakan logo khusus mobile" — whether the mobile logo overrides the header logo.
   * Omitted for Favicon, which has no separate enabled flag. */
  toggle?: { label: string; checked: boolean };
  onSave: (payload: { mediaId: string | null; altText: string; toggleChecked: boolean }) => Promise<unknown>;
  onResetToDefault: () => Promise<unknown>;
  /** Favicon has no meaningful alt text (browsers/OSes don't display one). */
  showAltText?: boolean;
}

/**
 * One self-contained Brand & Logo slot (Header/Footer/Mobile/Favicon) — its own upload,
 * preview, alt text, toggle, Save/Cancel/Delete/Reset. Upload only stages a new file locally;
 * nothing reaches the public site until "Simpan Perubahan" succeeds (RULE: no auto-publish —
 * see README "Brand & Logo").
 */
export function BrandLogoCard({
  title,
  description,
  hint,
  media,
  altText,
  defaultAltText,
  maxSizeBytes,
  toggle,
  onSave,
  onResetToDefault,
  showAltText = true,
}: BrandLogoCardProps) {
  // "Saved baseline" — separate from the `media`/`altText`/`toggle` props (which only ever
  // reflect the *initial* load), because this card fully owns its own save lifecycle. It's
  // updated after every successful save/delete/reset, exactly so `isDirty` compares pending
  // values against what's *actually* persisted right now, not what was persisted when this
  // card first mounted (the same staleness bug useAutosaveField had to fix elsewhere).
  const [savedMedia, setSavedMedia] = useState<Media | null>(media);
  const [savedAlt, setSavedAlt] = useState(altText);
  const [savedToggle, setSavedToggle] = useState(toggle?.checked ?? false);

  const [pendingMedia, setPendingMedia] = useState<Media | null>(media);
  const [pendingAlt, setPendingAlt] = useState(altText);
  const [pendingToggle, setPendingToggle] = useState(toggle?.checked ?? false);
  const [previewBg, setPreviewBg] = useState<"light" | "dark" | "checker">("light");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { status, error, run } = useSaveState();
  const { showToast } = useToast();

  const isDirty =
    (pendingMedia?.id ?? null) !== (savedMedia?.id ?? null) ||
    pendingAlt !== savedAlt ||
    (toggle ? pendingToggle !== savedToggle : false);

  function handleCancel() {
    setPendingMedia(savedMedia);
    setPendingAlt(savedAlt);
    setPendingToggle(savedToggle);
  }

  async function handleSave() {
    const result = await run(() =>
      onSave({ mediaId: pendingMedia?.id ?? null, altText: pendingAlt, toggleChecked: pendingToggle }),
    );
    if (result.success) {
      setSavedMedia(pendingMedia);
      setSavedAlt(pendingAlt);
      setSavedToggle(pendingToggle);
      showToast("Logo berhasil diperbarui.");
    } else {
      showToast("Logo gagal diperbarui. Silakan coba lagi.", "error");
    }
  }

  async function handleDelete() {
    setConfirmingDelete(false);
    const result = await run(() => onSave({ mediaId: null, altText: pendingAlt, toggleChecked: false }));
    if (result.success) {
      setPendingMedia(null);
      setPendingToggle(false);
      setSavedMedia(null);
      setSavedToggle(false);
      showToast("Logo berhasil dihapus.");
    } else {
      showToast("Logo gagal dihapus. Silakan coba lagi.", "error");
    }
  }

  async function handleReset() {
    setConfirmingReset(false);
    setResetting(true);
    try {
      await onResetToDefault();
      setPendingMedia(null);
      setPendingAlt(defaultAltText);
      setPendingToggle(false);
      setSavedMedia(null);
      setSavedAlt(defaultAltText);
      setSavedToggle(false);
      showToast("Logo dikembalikan ke default.");
    } catch {
      showToast("Gagal mengembalikan ke logo default. Silakan coba lagi.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-h3 text-neutral-900">{title}</h3>
          <p className="mt-1 text-small text-neutral-600">{description}</p>
        </div>
        {isDirty && (
          <span className="shrink-0 rounded-field bg-accent-500/10 px-2.5 py-1 text-small font-medium text-accent-600">
            Perubahan belum disimpan
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-small text-neutral-500">Preview:</span>
        {(["light", "dark", "checker"] as const).map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => setPreviewBg(bg)}
            className={cn(
              "rounded-field px-2.5 py-1 text-small transition-colors",
              previewBg === bg ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            )}
          >
            {bg === "light" ? "Terang" : bg === "dark" ? "Gelap" : "Transparan"}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <MediaUploadField
          label={title}
          media={pendingMedia}
          onChange={setPendingMedia}
          onRemove={() => setPendingMedia(null)}
          maxSizeBytes={maxSizeBytes}
          hint={hint}
          previewFit="contain"
          previewBackgroundClassName={PREVIEW_BACKGROUNDS[previewBg]}
        />
      </div>

      {showAltText && (
        <div className="mt-4">
          <Label htmlFor={`${title}-alt-text`} className="text-small">
            Logo Alt Text
          </Label>
          <Input
            id={`${title}-alt-text`}
            value={pendingAlt}
            onChange={(e) => setPendingAlt(e.target.value)}
            placeholder={defaultAltText}
          />
          <p className="mt-1 text-small text-neutral-500">Kosongkan untuk menggunakan default: “{defaultAltText}”.</p>
        </div>
      )}

      {toggle && (
        <label className="mt-4 flex w-fit items-center gap-2 text-body text-neutral-900">
          <input
            type="checkbox"
            checked={pendingToggle}
            onChange={(e) => setPendingToggle(e.target.checked)}
            className="h-4 w-4"
          />
          {toggle.label}
        </label>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void handleSave()} disabled={status === "saving" || !isDirty}>
          {status === "saving" ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={status === "saving" || !isDirty}>
          Batal
        </Button>
        {savedMedia && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={status === "saving"}
            className="text-small text-red-600 underline underline-offset-2 disabled:opacity-50"
          >
            Hapus Logo
          </button>
        )}
        {savedMedia && (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            disabled={status === "saving" || resetting}
            className="text-small text-neutral-600 underline underline-offset-2 disabled:opacity-50"
          >
            Gunakan Logo Default
          </button>
        )}
        <SaveStateIndicator status={status} error={error} />
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Hapus logo ini?"
          message="Logo yang dihapus tidak akan digunakan pada website."
          confirmLabel="Hapus Logo"
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {confirmingReset && (
        <ConfirmDialog
          title="Gunakan logo default?"
          message="Logo saat ini akan diganti dengan tampilan default (wordmark teks) pada website."
          confirmLabel="Gunakan Default"
          onConfirm={() => void handleReset()}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </Card>
  );
}
