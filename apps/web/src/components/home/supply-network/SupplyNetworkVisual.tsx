"use client";

import type {
  HomepageSupplyNetworkSection,
  SupplyNetworkConnection,
  SupplyNetworkCountry,
  SupplyNetworkItem,
} from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/Link";
import { CoconutMark, SafeImage } from "@/components/SafeImage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SupplyNetworkNodeIcon } from "./SupplyNetworkIcons";

/** Percentage-based orbit — nodes sit at even angles around the center regardless of how many
 * are active, so adding/removing a node in the admin never needs a matching layout preset (the
 * old fixed-4-node "fan" table this replaces did). Index 0 starts at the top and proceeds
 * clockwise, matching each node's `order`. */
const ORBIT_RADIUS_PCT = 40;
const CENTER_PCT = 50;

function nodeAngleDeg(index: number, total: number) {
  return (index / total) * 360 - 90;
}

function orbitPosition(index: number, total: number) {
  const angle = (nodeAngleDeg(index, total) * Math.PI) / 180;
  return {
    left: `${CENTER_PCT + ORBIT_RADIUS_PCT * Math.cos(angle)}%`,
    top: `${CENTER_PCT + ORBIT_RADIUS_PCT * Math.sin(angle)}%`,
  };
}

/** Cubic-bezier curve between two points, pulled toward their midpoint so it reads as a curved
 * "flow path" rather than a straight spoke — same technique as the previous single-hub diagram,
 * generalized to any two arbitrary points (node→center or node→node). */
function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Perpendicular offset, scaled to the segment length, so short and long paths curve
  // proportionally instead of a fixed pixel bow.
  const bow = Math.hypot(dx, dy) * 0.12;
  const cx = mx - dy * (bow / Math.hypot(dx, dy) || 0);
  const cy = my + dx * (bow / Math.hypot(dx, dy) || 0);
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/** Two glowing dots riding a path via native SVG SMIL (`<animateMotion>`) — no animation library
 * needed. Rendered only while `particle_flow` is enabled and the connection is active, so the
 * section stays calm at rest. */
function FlowParticles({ d }: { d: string }) {
  return (
    <>
      <circle r={5.5} className="fill-primary-500" fillOpacity={0.22}>
        <animateMotion path={d} dur="3.2s" begin="0s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1" />
      </circle>
      <circle r={2.5} className="fill-primary-500">
        <animateMotion path={d} dur="3.2s" begin="-1.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1" />
      </circle>
    </>
  );
}

const REVEAL_STEP_MS = 200;
const CENTER_REVEAL_MS = 0;

/**
 * "Our Supply Network" — a premium CSS-3D + SVG ecosystem diagram: a glowing center "PPN" node
 * with the active items orbiting it at even angles, connected by curved animated paths (every
 * node always spokes to center; admin-configured `connections` additionally draw the sequential
 * supply-flow path the particles travel along). No WebGL/Three.js — perspective/translateZ/
 * rotateX/rotateY CSS transforms plus SVG give the same "alive 3D" read (depth, glow, motion)
 * at a fraction of the bundle cost and with automatic accessibility/reduced-motion safety.
 *
 * Reveal is a one-shot `IntersectionObserver` staggering center → node 01 → 02 → ... so nothing
 * heavy runs before the section is actually in view. A subtle mouse-parallax tilts the whole
 * scene up to ~4° (desktop, pointer-driven, disabled on touch) and a slow decorative ring behind
 * the nodes keeps rotating continuously (pausing on hover/click) — the *clickable* node
 * positions themselves stay fixed, since rotating interactive targets under a visitor's cursor
 * would be a usability regression, not a delight. Every ambient effect is gated by the admin's
 * `enable_animation`/`hover_effect`/`effect_3d`/`particle_flow` toggles and forced off under
 * `prefers-reduced-motion`.
 */
export function SupplyNetworkVisual({
  section,
  items,
  connections,
  countries,
}: {
  section: HomepageSupplyNetworkSection;
  items: SupplyNetworkItem[];
  connections: SupplyNetworkConnection[];
  countries: SupplyNetworkCountry[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  const animationsOn = section.enable_animation && !reducedMotion;
  const hoverOn = section.hover_effect;
  const effect3dOn = section.effect_3d && !reducedMotion;
  const particlesOn = section.particle_flow && animationsOn;
  const rotateOn = section.auto_rotate && animationsOn && !paused;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!effect3dOn || !sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    sceneRef.current.style.transform = `rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
  }
  function handleMouseLeave() {
    if (sceneRef.current) sceneRef.current.style.transform = "";
    setPaused(false);
  }

  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const activeIndex = activeItem ? items.indexOf(activeItem) : -1;

  const positions = useMemo(() => {
    const map = new Map<string, { left: string; top: string }>();
    items.forEach((item, index) => map.set(item.id, orbitPosition(index, items.length)));
    return map;
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef}>
      {/* Desktop/tablet — radial 3D ecosystem */}
      <div
        className="relative mx-auto hidden aspect-square w-full max-w-[640px] [perspective:1400px] lg:block"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setActiveId(null);
            (document.activeElement as HTMLElement | null)?.blur?.();
          }
        }}
      >
        <BackgroundGlobe countries={countries} revealed={revealed} />

        <div
          ref={sceneRef}
          className="absolute inset-0 transition-transform duration-500 ease-out [transform-style:preserve-3d]"
        >
          {/* Slow-rotating decorative ring — purely ambient, never an interactive target. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[6%] rounded-full border border-dashed border-primary-300/50"
            style={{ animation: rotateOn ? "supply-network-orbit-spin 32s linear infinite" : undefined }}
          />

          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {items.map((item, index) => {
              const pos = orbitPosition(index, items.length);
              const x2 = parseFloat(pos.left);
              const y2 = parseFloat(pos.top);
              const isActive = activeItem?.id === item.id;
              const d = curvePath(CENTER_PCT, CENTER_PCT, x2, y2);
              return (
                <g key={`spoke-${item.id}`}>
                  <path
                    d={d}
                    fill="none"
                    strokeWidth={0.4}
                    strokeLinecap="round"
                    strokeDasharray="1.4 1.6"
                    className={cn("transition-[stroke,stroke-opacity] duration-300", isActive ? "stroke-primary-500" : "stroke-neutral-300")}
                    strokeOpacity={isActive ? 0.9 : 0.45}
                    style={{
                      strokeDashoffset: revealed ? 0 : 60,
                      transition: `stroke-dashoffset 800ms ease-out ${REVEAL_STEP_MS * (index + 1)}ms, stroke 300ms ease-out, stroke-opacity 300ms ease-out`,
                    }}
                  />
                  {isActive && particlesOn && <FlowParticles d={d} />}
                </g>
              );
            })}
            {connections.map((connection) => {
              const from = positions.get(connection.from_node_id);
              const to = positions.get(connection.to_node_id);
              if (!from || !to) return null;
              const isActive =
                activeItem?.id === connection.from_node_id || activeItem?.id === connection.to_node_id;
              const d = curvePath(parseFloat(from.left), parseFloat(from.top), parseFloat(to.left), parseFloat(to.top));
              return (
                <g key={connection.id}>
                  <path
                    d={d}
                    fill="none"
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    className={cn("transition-[stroke,stroke-opacity] duration-300", isActive ? "stroke-accent-500" : "stroke-primary-300")}
                    strokeOpacity={revealed ? (isActive ? 0.9 : 0.5) : 0}
                    style={{ transition: `stroke-opacity 600ms ease-out ${CENTER_REVEAL_MS}ms` }}
                  />
                  {isActive && particlesOn && <FlowParticles d={d} />}
                </g>
              );
            })}
          </svg>

          {/* Center PPN node */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-400"
            style={{ animation: animationsOn ? "supply-network-pulse-ring 3.5s ease-out infinite" : undefined }}
          />
          <div
            className={cn(
              "absolute left-1/2 top-1/2 flex aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-primary-500 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-center text-white shadow-[0_20px_60px_-16px_rgba(74,101,30,0.6)] transition-[opacity,transform] duration-700 ease-out",
              revealed ? "scale-100 opacity-100" : "scale-90 opacity-0",
            )}
            style={{ animation: animationsOn ? "supply-network-breathe 4.5s ease-in-out infinite" : undefined }}
          >
            <span className="inline-block" style={{ animation: animationsOn ? "supply-network-icon-float 4s ease-in-out infinite" : undefined }}>
              <CoconutMark className="h-6 w-6 text-white/90" />
            </span>
            <p className="mt-1 text-h3 font-bold leading-none">{section.center_label}</p>
            <p className="mt-1.5 px-2 text-[10px] font-medium uppercase leading-tight tracking-wide opacity-85">
              {section.center_title}
            </p>
          </div>

          {/* Orbiting nodes */}
          {items.map((item, index) => {
            const pos = positions.get(item.id)!;
            const isActive = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => hoverOn && setActiveId(item.id)}
                onFocus={() => setActiveId(item.id)}
                onClick={() => setActiveId(item.id)}
                aria-pressed={isActive}
                aria-label={`${item.title}: ${item.short_title || item.description}`}
                className={cn(
                  "absolute flex aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border-2 bg-white/95 backdrop-blur-sm transition-[transform,box-shadow,border-color,opacity] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
                  isActive
                    ? "z-10 scale-[1.08] border-primary-500 shadow-[0_0_0_8px_rgba(139,194,54,0.16)]"
                    : "border-neutral-200 hover:scale-[1.04] hover:border-primary-300",
                )}
                style={{
                  left: pos.left,
                  top: pos.top,
                  opacity: revealed ? (activeItem ? (isActive ? 1 : 0.55) : 1) : 0,
                  transitionDelay: revealed ? "0ms" : `${REVEAL_STEP_MS * (index + 1)}ms`,
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -inset-2 -z-10 rounded-full bg-primary-400/30 blur-md transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                <span
                  className="inline-block"
                  style={{ animation: animationsOn ? `supply-network-icon-float 3.5s ease-in-out ${index * 300}ms infinite` : undefined }}
                >
                  <SupplyNetworkNodeIcon icon={item.icon} className={cn("h-5 w-5 transition-colors duration-300", isActive ? "text-primary-600" : "text-neutral-500")} />
                </span>
                <span className={cn("text-[10px] font-semibold transition-colors duration-300", isActive ? "text-primary-700" : "text-neutral-400")}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <NodeInfoPanel item={activeItem} index={activeIndex} className="hidden lg:block" />

      {/* Mobile/tablet — horizontal swipeable node carousel below a static center badge */}
      <MobileSupplyNetworkCarousel section={section} items={items} activeId={activeId} onSelect={setActiveId} />
    </div>
  );
}

function NodeInfoPanel({
  item,
  index,
  className,
}: {
  item: SupplyNetworkItem | null;
  index: number;
  className?: string;
}) {
  if (!item) {
    return (
      <div className={cn("mx-auto mt-8 max-w-xl text-center text-small text-neutral-500", className)}>
        Klik salah satu node untuk melihat detailnya.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-primary-200/70 bg-white/75 text-center shadow-[0_20px_60px_-24px_rgba(74,101,30,0.35)] backdrop-blur-md",
        className,
      )}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary-500/25 via-primary-400/10 to-transparent blur-3xl" />
      {item.illustration && (
        <div className="relative aspect-video w-full overflow-hidden">
          <SafeImage media={item.illustration} sizes="576px" />
        </div>
      )}
      <div className="relative p-6">
        <p className="text-small font-semibold uppercase tracking-wide text-primary-700">
          {String(index + 1).padStart(2, "0")} — {item.title}
        </p>
        <h3 className="mt-1 text-h3 text-neutral-900">{item.short_title || item.title}</h3>
        <p className="mt-2 text-body text-neutral-600">{item.description}</p>
        {item.cta_label && item.cta_href && (
          <Link href={item.cta_href} className="mt-3 inline-block text-small font-medium text-primary-700 underline">
            {item.cta_label}
          </Link>
        )}
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">PPN Supply Network</p>
      </div>
    </div>
  );
}

/** Subtle, near-transparent background markers for a handful of destination countries — never
 * a real map, just a soft radial motif giving the diagram a "global trade" backdrop (brief
 * §17/§18). Purely decorative, `aria-hidden`. */
function BackgroundGlobe({ countries, revealed }: { countries: SupplyNetworkCountry[]; revealed: boolean }) {
  if (countries.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-[-10%] rounded-full border border-primary-200/30 opacity-0 transition-opacity duration-1000"
      style={{ opacity: revealed ? 1 : 0 }}
    >
      <span className="absolute inset-0 rounded-full border border-primary-200/20" style={{ transform: "scale(0.75)" }} />
      <span className="absolute inset-0 rounded-full border border-primary-200/15" style={{ transform: "scale(0.5)" }} />
      {countries.map((country, index) => {
        const angle = ((index / countries.length) * 360 + 40) * (Math.PI / 180);
        const left = 50 + 47 * Math.cos(angle);
        const top = 50 + 47 * Math.sin(angle);
        return (
          <span
            key={country.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-neutral-500 shadow-sm backdrop-blur-sm"
            style={{ left: `${left}%`, top: `${top}%` }}
            title={country.status}
          >
            <span aria-hidden="true">{country.flag_emoji}</span>
            {country.name}
          </span>
        );
      })}
    </div>
  );
}

function MobileSupplyNetworkCarousel({
  section,
  items,
  activeId,
  onSelect,
}: {
  section: HomepageSupplyNetworkSection;
  items: SupplyNetworkItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const activeIndex = activeItem ? items.indexOf(activeItem) : -1;

  return (
    <div className="lg:hidden">
      <div className="relative mx-auto flex w-fit flex-col items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-16 w-16 rounded-full border-2 border-primary-400"
          style={{ animation: section.enable_animation ? "supply-network-pulse-ring 3.5s ease-out infinite" : undefined }}
        />
        <div
          className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-primary-500 bg-gradient-to-br from-primary-500 to-primary-700 text-center text-white shadow-[0_10px_30px_-10px_rgba(74,101,30,0.5)]"
          style={{ animation: section.enable_animation ? "supply-network-breathe 4.5s ease-in-out infinite" : undefined }}
        >
          <CoconutMark className="h-4 w-4 text-white/90" />
          <p className="text-[11px] font-bold leading-none">{section.center_label}</p>
        </div>
      </div>

      <div className="mt-6 flex snap-x snap-proximity gap-3 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={isActive}
              className={cn(
                "flex w-[132px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 text-center transition-[background-color,border-color] duration-300",
                isActive ? "border-primary-500 bg-primary-50" : "border-neutral-200 bg-white",
              )}
            >
              <SupplyNetworkNodeIcon icon={item.icon} className={cn("h-6 w-6", isActive ? "text-primary-600" : "text-neutral-400")} />
              <span className={cn("text-[10px] font-semibold", isActive ? "text-primary-700" : "text-neutral-400")}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={cn("text-small font-medium leading-snug", isActive ? "text-neutral-900" : "text-neutral-600")}>{item.title}</span>
            </button>
          );
        })}
      </div>

      <NodeInfoPanel item={activeItem} index={activeIndex} className="mx-4" />
    </div>
  );
}
