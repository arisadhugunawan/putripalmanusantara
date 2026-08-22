"use client";

import { useEffect, useRef, useState } from "react";

/** Supports watch/youtu.be/embed/shorts URLs, with or without extra query params
 * (`?si=`, `&t=`, playlist context, etc.) — the Admin only ever pastes a normal YouTube URL,
 * never an embed URL by hand. */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const embedMatch = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
      if (embedMatch) return embedMatch[2];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Section 5/6/7 of the redesign brief — large premium YouTube video, Admin-controlled via a
 * single raw URL field (any supported format; the ID is extracted here, never hand-built by
 * the Admin). Thumbnail-first: the real YouTube iframe only mounts after a click, so the page
 * never pays for YouTube's own script/autoplay cost until the visitor actually wants to watch —
 * and nothing ever autoplays with sound on page load. Reveals on scroll (opacity + translateY +
 * scale via a plain CSS transition, so the site's existing global
 * `prefers-reduced-motion` rule in globals.css neutralizes it automatically, same mechanism as
 * `FadeUpSection`). An invalid/unparseable URL degrades to an honest "Video unavailable"
 * message rather than a broken embed.
 */
export function YouTubeVideoEmbed({ url }: { url: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!url) return null;
  const videoId = extractYouTubeId(url);

  return (
    <div
      ref={ref}
      className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-neutral-900 shadow-[0_24px_48px_-20px_rgba(24,61,43,0.35)] transition-[opacity,transform] duration-[800ms] ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
      }}
    >
      {!videoId && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-500">
          <p className="text-body font-medium">Video unavailable</p>
        </div>
      )}

      {videoId && !playing && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play video"
          className="group absolute inset-0 h-full w-full"
        >
          {!thumbnailFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- external YouTube-hosted thumbnail, not an optimizable local/remote asset in next/image's config
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt=""
              onError={(e) => {
                // maxresdefault.jpg doesn't exist for every video — hqdefault.jpg always does.
                if (e.currentTarget.src.includes("maxresdefault")) {
                  e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                } else {
                  setThumbnailFailed(true);
                }
              }}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full bg-neutral-800" />
          )}
          <div className="absolute inset-0 bg-neutral-900/25 transition-colors duration-300 group-hover:bg-neutral-900/35" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform duration-250 ease-out group-hover:scale-110 sm:h-20 sm:w-20">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="#183D2B" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}

      {videoId && playing && (
        <iframe
          title="Company video"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
