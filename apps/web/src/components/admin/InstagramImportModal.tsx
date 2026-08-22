"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@ppn/ui-components";
import type { InstagramDuplicateResult, InstagramImportResult } from "@ppn/shared-types";
import { adminApi } from "@/lib/admin/client";

const IG_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i;

export const IG_IMPORT_PREFILL_KEY = "ppn_ig_import_prefill";

/** Read once by admin/artikel/baru on mount — see handleUseThisContent/handleContinueManually
 * below. `imported_at` is set ONLY by a real oEmbed fetch (brief §26: the Admin's manual
 * fields must never be silently mislabeled as an automatic import). */
export interface InstagramImportPrefill {
  url: string;
  caption?: string;
  username?: string;
  imported_at?: string;
}

type FetchState =
  | { phase: "input" }
  | { phase: "fetching" }
  | { phase: "invalid" }
  | { phase: "duplicate"; result: InstagramDuplicateResult }
  | { phase: "unavailable"; message: string }
  | { phase: "preview"; result: Extract<InstagramImportResult, { available: true }> };

/** "+ Import from Instagram" flow (brief §05/06/07/56): paste a URL, attempt an automatic
 * fetch, and either preview the result or fall back to manual entry — never a fatal error,
 * and never anything that auto-publishes (this only ever hands off to the Draft editor). */
export function InstagramImportModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<FetchState>({ phase: "input" });
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  async function handleFetch(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!IG_URL_PATTERN.test(trimmed)) {
      setState({ phase: "invalid" });
      return;
    }
    setState({ phase: "fetching" });
    try {
      const result = await adminApi.post<InstagramImportResult | InstagramDuplicateResult>(
        "/admin/articles/instagram/fetch",
        { url: trimmed },
      );
      if ("duplicate" in result) {
        setState({ phase: "duplicate", result });
      } else if (result.available) {
        setState({ phase: "preview", result });
      } else if (result.reason === "invalid_url") {
        setState({ phase: "invalid" });
      } else {
        setState({ phase: "unavailable", message: result.message });
      }
    } catch {
      setState({
        phase: "unavailable",
        message: "Instagram content could not be imported automatically. Continue manually below.",
      });
    }
  }

  function goToEditor(prefill: InstagramImportPrefill) {
    sessionStorage.setItem(IG_IMPORT_PREFILL_KEY, JSON.stringify(prefill));
    router.push("/admin/artikel/baru");
  }

  function handleUseThisContent() {
    if (state.phase !== "preview") return;
    goToEditor({
      url: state.result.permalink,
      caption: state.result.caption ?? undefined,
      username: state.result.username ?? undefined,
      imported_at: new Date().toISOString(),
    });
  }

  function handleContinueManually() {
    goToEditor({ url: url.trim() });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import from Instagram"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-neutral-900">Import from Instagram</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-field p-1 text-neutral-500 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFetch} className="mt-4 flex flex-col gap-3">
          <div>
            <Label htmlFor="ig-import-url">Instagram Post URL</Label>
            <Input
              id="ig-import-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (state.phase !== "input") setState({ phase: "input" });
              }}
              placeholder="https://www.instagram.com/p/..."
              autoFocus
            />
          </div>
          <Button type="submit" disabled={state.phase === "fetching" || !url.trim()} className="w-fit">
            {state.phase === "fetching" ? "Fetching..." : "Fetch Post"}
          </Button>
        </form>

        {state.phase === "invalid" && (
          <p className="mt-4 rounded-field bg-red-50 p-3 text-small text-red-700">
            Please enter a valid Instagram post URL.
          </p>
        )}

        {state.phase === "duplicate" && (
          <div className="mt-4 rounded-field border border-secondary-300 bg-secondary-50 p-4">
            <p className="text-body text-neutral-900">This Instagram post has already been added.</p>
            <a
              href={`/admin/artikel/${state.result.existing_article_id}`}
              className="mt-2 inline-block text-small font-medium text-primary-700 underline"
            >
              View Existing Article: {state.result.existing_article_title}
            </a>
          </div>
        )}

        {state.phase === "unavailable" && (
          <div className="mt-4 rounded-field border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-body text-neutral-900">{state.message}</p>
            <Button type="button" variant="secondary" onClick={handleContinueManually} className="mt-3 w-fit">
              Continue Manually
            </Button>
          </div>
        )}

        {state.phase === "preview" && (
          <div className="mt-4 rounded-field border border-neutral-200 p-4">
            <div className="flex gap-4">
              {state.result.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element -- external Instagram CDN thumbnail, not a local/CMS asset next/image can optimize
                <img
                  src={state.result.thumbnail_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-field object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                {state.result.username && (
                  <p className="text-small font-medium text-neutral-900">@{state.result.username}</p>
                )}
                {state.result.caption && (
                  <p className="mt-1 line-clamp-3 text-small text-neutral-600">{state.result.caption}</p>
                )}
                <a
                  href={state.result.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-small text-primary-700 underline"
                >
                  View original post ↗
                </a>
              </div>
            </div>
            <Button type="button" onClick={handleUseThisContent} className="mt-4 w-fit">
              Use This Content
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
