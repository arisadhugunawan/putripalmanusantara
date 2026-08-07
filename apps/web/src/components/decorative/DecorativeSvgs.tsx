import type { DecorativeGraphicVariant } from "@ppn/shared-types";

/**
 * Hand-authored monochrome line-art watermarks — a `variant` key from the CMS selects one
 * of these instead of an uploaded photo. Generic decorative motifs (leaf/ship/compass
 * outlines), not a claim about a real PPN photo, so authoring them directly is fine under
 * this project's "no fabricated imagery" rule (see README).
 */
export const DECORATIVE_SVGS: Record<DecorativeGraphicVariant, (props: { className?: string }) => React.ReactNode> = {
  leaf_outline: LeafOutline,
  coconut_cross_section: CoconutCrossSection,
  ship_outline: ShipOutline,
  compass: Compass,
  world_map_outline: WorldMapOutline,
  palm_leaf: PalmLeaf,
  coconut_tree_silhouette: CoconutTreeSilhouette,
  container_outline: ContainerOutline,
};

const STROKE = { stroke: "currentColor", strokeWidth: 1, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function LeafOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <path d="M100 10C40 40 20 100 40 160c60 20 120 0 150-60C170 40 140 10 100 10Z" {...STROKE} />
      <path d="M100 15C90 70 70 130 40 158" {...STROKE} />
      <path d="M70 60c15 5 25 15 30 30M65 100c18 4 30 14 36 30M75 140c14 2 24 8 30 18" {...STROKE} />
    </svg>
  );
}

function CoconutCrossSection({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="85" {...STROKE} />
      <circle cx="100" cy="100" r="62" {...STROKE} />
      <circle cx="100" cy="100" r="34" {...STROKE} />
      <path d="M100 15v170M15 100h170M42 42l116 116M158 42 42 158" {...STROKE} strokeDasharray="2 10" />
    </svg>
  );
}

function ShipOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true">
      <path d="M30 110h180l-20 35H50l-20-35Z" {...STROKE} />
      <path d="M55 110V70h130v40M75 70V45h20v25M115 70V35h20v35M155 70V50h20v20" {...STROKE} />
      <path d="M10 130c15 8 30 8 45 0s30-8 45 0 30 8 45 0 30-8 45 0 30 8 45 0" {...STROKE} />
    </svg>
  );
}

function ContainerOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <rect x="15" y="30" width="170" height="80" rx="4" {...STROKE} />
      <path d="M15 50h170M15 70h170M15 90h170" {...STROKE} strokeDasharray="1 8" />
      <path d="M45 30v80M100 30v80M155 30v80" {...STROKE} strokeDasharray="1 8" />
      <rect x="30" y="42" width="24" height="16" rx="1" {...STROKE} />
    </svg>
  );
}

function Compass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="85" {...STROKE} />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
      <path d="M100 25v20M100 155v20M25 100h20M155 100h20" {...STROKE} />
      <path d="M100 55 120 100 100 145 80 100Z" {...STROKE} />
    </svg>
  );
}

function WorldMapOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 160" className={className} aria-hidden="true">
      <ellipse cx="150" cy="80" rx="145" ry="75" {...STROKE} strokeDasharray="3 6" />
      <path
        d="M40 70c10-15 25-20 40-15s20 15 35 10 20-20 35-15 15 20 30 15 25-15 40-10M50 100c15-10 30-5 45 0s25 10 40 5 20-15 35-10 20 15 35 10"
        {...STROKE}
      />
      <circle cx="90" cy="65" r="3" fill="currentColor" />
      <circle cx="180" cy="90" r="3" fill="currentColor" />
      <circle cx="230" cy="60" r="3" fill="currentColor" />
      <path d="M90 65C130 50 180 55 180 90M180 90c25-10 35-15 50-30" {...STROKE} strokeDasharray="1 6" />
    </svg>
  );
}

function PalmLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <path d="M100 190V90" {...STROKE} />
      <path d="M100 100C60 90 30 60 15 25c40 0 75 20 90 55" {...STROKE} />
      <path d="M100 100C60 70 40 30 35 5c40 10 65 35 75 75" {...STROKE} />
      <path d="M100 100C140 90 170 60 185 25c-40 0-75 20-90 55" {...STROKE} />
      <path d="M100 100C140 70 160 30 165 5c-40 10-65 35-75 75" {...STROKE} />
      <path d="M100 100C75 95 55 80 45 60" {...STROKE} />
      <path d="M100 100C125 95 145 80 155 60" {...STROKE} />
    </svg>
  );
}

function CoconutTreeSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      <path d="M105 230c-8-60-10-110 0-160" {...STROKE} />
      <path d="M105 230c8-55 12-100 5-155" {...STROKE} />
      <path d="M105 70c-30-10-55-5-75 15 25 10 50 5 75-15Z" {...STROKE} />
      <path d="M105 70c30-15 55-12 78 5-25 15-52 12-78-5Z" {...STROKE} />
      <path d="M105 65c-15-25-15-45-2-62 15 15 17 38 2 62Z" {...STROKE} />
      <path d="M105 65c15-22 35-30 55-25-10 20-30 30-55 25Z" {...STROKE} />
      <path d="M105 65c-18-18-40-22-58-12 12 18 35 22 58 12Z" {...STROKE} />
      <circle cx="95" cy="78" r="4" {...STROKE} />
      <circle cx="105" cy="82" r="4" {...STROKE} />
    </svg>
  );
}
