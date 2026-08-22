"use client";

import { useEffect, useRef, useState } from "react";

const TIKTOK_URL_PATTERN = /^https?:\/\/(www\.|vt\.|vm\.)?tiktok\.com\//i;
/** How long to wait for TikTok's own script to produce a player before treating the embed as
 * failed (network block, ad blocker, TikTok outage) and falling back to a plain link. */
const EMBED_TIMEOUT_MS = 8000;

/**
 * Renders TikTok's OFFICIAL embed (`<blockquote class="tiktok-embed">` + `embed.js`) — never
 * scrapes, downloads, or re-hosts the video. The script tag is appended as a child of the same
 * container as the blockquote, mirroring the exact snippet TikTok's own "Embed" button
 * generates, so the iframe it injects lands where this component can detect it.
 *
 * Falls back to a "Watch on TikTok →" link if the URL doesn't look like a TikTok link at all, or
 * if no iframe has appeared within `EMBED_TIMEOUT_MS`. Once rendering starts, the JSX for the
 * blockquote branch never changes shape again — TikTok's script mutates that DOM node directly,
 * and re-rendering the same element (rather than swapping it for different JSX) keeps React's
 * reconciliation from fighting over it.
 */
export function TikTokEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(() => !TIKTOK_URL_PATTERN.test(url));

  useEffect(() => {
    if (failed) return;
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    script.onerror = () => setFailed(true);
    container.appendChild(script);

    const timeout = setTimeout(() => {
      if (!container.querySelector("iframe")) setFailed(true);
    }, EMBED_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [url, failed]);

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Watch this video on TikTok"
        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0f1f14] text-white transition-colors hover:bg-[#16281b]"
      >
        <TikTokGlyph className="h-8 w-8 text-[#A7D94C]" />
        <span className="text-body-lg font-semibold">Watch on TikTok →</span>
      </a>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center bg-[#0f1f14] [&_.tiktok-embed]:!m-0 [&_.tiktok-embed]:!h-full [&_.tiktok-embed]:!max-w-none [&_.tiktok-embed]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full"
    >
      <blockquote className="tiktok-embed" cite={url} data-embed-from="oembed">
        <section />
      </blockquote>
    </div>
  );
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-.98-.86-1.6-2.1-1.6-3.48h-3.12v13.4a3.02 3.02 0 1 1-2.15-2.9V9.66a6.14 6.14 0 1 0 5.27 6.08V9.4a6.68 6.68 0 0 0 3.6 1.05V7.33a3.5 3.5 0 0 1-2-1.51Z" />
    </svg>
  );
}
