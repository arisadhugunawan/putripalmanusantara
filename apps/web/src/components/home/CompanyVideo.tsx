"use client";

import type { HomepageAboutPreview } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { SafeImage } from "@/components/SafeImage";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}

/**
 * Company video for the About Preview section. Admin chooses the source (YouTube, Vimeo, or
 * an uploaded file); "none" — the real seeded state, since no company video exists yet —
 * renders SafeImage's own honest placeholder instead of a fabricated thumbnail/embed.
 * YouTube/Vimeo use a click-to-load facade (thumbnail + play button first, iframe mounted
 * only on click) so the section never pays an embed's script/network cost until a visitor
 * actually wants to watch.
 */
export function CompanyVideo({ preview, dictionary }: { preview: HomepageAboutPreview; dictionary: Dictionary }) {
  const [playing, setPlaying] = useState(false);

  const wrapperClass = "relative aspect-video w-full overflow-hidden rounded-card border border-neutral-200 shadow-card";

  if (preview.video_source === "upload" && preview.video_media) {
    return (
      <div className={wrapperClass}>
        <video
          controls
          preload="none"
          poster={preview.video_thumbnail?.file_url}
          className="h-full w-full object-cover"
        >
          <source src={preview.video_media.file_url} />
        </video>
      </div>
    );
  }

  const youTubeId = preview.video_source === "youtube" && preview.video_url ? extractYouTubeId(preview.video_url) : null;
  const vimeoId = preview.video_source === "vimeo" && preview.video_url ? extractVimeoId(preview.video_url) : null;

  if (youTubeId || vimeoId) {
    if (playing) {
      const src = youTubeId
        ? `https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1`
        : `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
      return (
        <div className={wrapperClass}>
          <iframe
            src={src}
            title={preview.heading}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    const thumbnail = preview.video_thumbnail?.file_url ?? (youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg` : null);

    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`${dictionary.home.companyVideo.playVideoPrefix} ${preview.heading}`}
        className={cn(wrapperClass, "group block w-full cursor-pointer")}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- external YouTube/Vimeo thumbnail URL, not an optimizable local/CMS asset
          <img src={thumbnail} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <SafeImage media={null} />
        )}
        <span className="absolute inset-0 bg-neutral-900/25 transition-colors group-hover:bg-neutral-900/35" aria-hidden="true" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary-700 shadow-card-hover transition-transform duration-200 group-hover:scale-110">
            <PlayIcon />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className={wrapperClass}>
      <SafeImage media={null} />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}
