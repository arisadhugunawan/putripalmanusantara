"use client";

import type { FactoryVideo } from "@ppn/shared-types";
import { useEffect, useRef, useState } from "react";
import { TikTokEmbed } from "./TikTokEmbed";

/**
 * "Featured Factory Video" — the section's opening visual (brief items 3-8). A single video
 * renders as one large centered card; more than one becomes a horizontal scroll-snap carousel
 * (native browser scroll, not a library) with the next card peeking at the edge on desktop and
 * exactly one card per view on mobile. Returns nothing when the Admin hasn't added any video —
 * this is a showcase, not a placeholder to fill.
 */
export function FactoryVideoShowcase({ videos }: { videos: FactoryVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-[#315F3A] via-[#26492f] to-[#16281b] p-6 sm:p-10">
      {/* Subtle agricultural texture — a faint dot grid, never competing with the video. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#A7D94C]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-[#6FAF3D]/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        {videos.length === 1 ? (
          <div className="mx-auto max-w-[380px]">
            <VideoCard video={videos[0]} />
            <VideoCaption video={videos[0]} />
          </div>
        ) : (
          <VideoCarousel videos={videos} />
        )}
      </div>
    </div>
  );
}

function VideoCarousel({ videos }: { videos: FactoryVideo[] }) {
  return (
    <div
      role="region"
      aria-label="Factory videos, scrollable"
      className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {videos.map((video) => (
        <div key={video.id} className="w-[78%] shrink-0 snap-center sm:w-[55%] lg:w-[38%]">
          <VideoCard video={video} />
          <VideoCaption video={video} />
        </div>
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: FactoryVideo }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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

  return (
    <div
      ref={ref}
      className="relative aspect-9/16 w-full overflow-hidden rounded-[28px] bg-[#0f1f14] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
      }}
    >
      <TikTokEmbed url={video.tiktok_url} />
    </div>
  );
}

function VideoCaption({ video }: { video: FactoryVideo }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-small font-semibold uppercase tracking-[0.1em] text-[#A7D94C]">Factory Video</p>
        <p className="mt-0.5 truncate text-body font-medium text-white">{video.title}</p>
      </div>
      <a
        href={video.tiktok_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-small font-medium text-white/90 underline underline-offset-4 transition-colors hover:text-[#A7D94C]"
      >
        Watch on TikTok →
      </a>
    </div>
  );
}
