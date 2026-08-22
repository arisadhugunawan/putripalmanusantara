"use client";

import type { TeamMember } from "@ppn/shared-types";
import { teamMemberPhotoAlt } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { hasTeamMemberProfile, TeamMemberModal } from "./TeamMemberModal";

/** Stagger between cards. Kept short on purpose — the whole grid should finish revealing in
 * well under a second, so it reads as polish rather than a performance (brief item 22). */
const STAGGER_MS = 70;
const MAX_STAGGER_MS = 420;

/**
 * Portrait grid for the PPN Team section.
 *
 * Reveal is a one-time IntersectionObserver toggle driving `opacity`/`transform` only
 * (compositor-friendly), with a per-card delay. Under `prefers-reduced-motion: reduce` the
 * global rule in globals.css collapses every transition to ~0ms, so the stagger disappears
 * and the cards simply appear — no separate code path to keep in sync.
 */
export function TeamGrid({ members }: { members: TeamMember[] }) {
  const [revealed, setRevealed] = useState(false);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const openMember = members.find((m) => m.id === openMemberId) ?? null;

  return (
    <>
      <ul
        ref={gridRef}
        className="mt-9 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
      >
        {members.map((member, index) => {
          const openable = hasTeamMemberProfile(member);
          const alt = teamMemberPhotoAlt(member);
          return (
            <li
              key={member.id}
              className={cn(
                "transition-[opacity,transform] duration-[700ms] ease-out",
                revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              )}
              style={{ transitionDelay: `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms` }}
            >
              <article
                className={cn(
                  "group h-full overflow-hidden rounded-card border border-neutral-200 bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out",
                  "hover:-translate-y-1 hover:border-primary-300 hover:shadow-card",
                  "focus-within:-translate-y-1 focus-within:border-primary-300 focus-within:shadow-card",
                )}
              >
                {/* 4:5 reserved before load so the grid never reflows (items 7/61). */}
                <div className="relative aspect-4/5 overflow-hidden bg-neutral-100">
                  {member.photo && member.photo.file_type === "image" ? (
                    <Image
                      src={member.photo.file_url}
                      alt={alt}
                      fill
                      // Portraits are below the fold on every breakpoint; lazy is the default
                      // and deliberately kept (item 64).
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 30vw, (min-width: 420px) 45vw, 100vw"
                      className="object-cover object-top transition-transform duration-[600ms] ease-out group-hover:scale-[1.025]"
                    />
                  ) : (
                    <PortraitPlaceholder name={member.name} />
                  )}
                  {member.featured && (
                    <span className="absolute left-3 top-3 rounded-button bg-white/95 px-2.5 py-1 text-small font-medium text-primary-700 shadow-[var(--shadow-card)]">
                      Featured
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {member.department && (
                    <p className="text-small font-medium uppercase tracking-wide text-primary-700">
                      {member.department}
                    </p>
                  )}
                  <h3 className={cn("text-body-lg font-semibold text-neutral-900", member.department && "mt-1")}>
                    {member.name}
                  </h3>
                  {/* Secondary, but still AA-contrast on white — not a washed-out gray. */}
                  <p className="mt-0.5 text-small text-neutral-600">{member.position}</p>

                  {openable && (
                    <button
                      type="button"
                      onClick={() => setOpenMemberId(member.id)}
                      className="mt-3 text-small font-medium text-primary-700 underline underline-offset-4 transition-colors hover:text-primary-600"
                    >
                      View profile
                      <span className="sr-only"> of {member.name}</span>
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {openMember && <TeamMemberModal member={openMember} onClose={() => setOpenMemberId(null)} />}
    </>
  );
}

/** Neutral initials placeholder — never a broken image icon when no portrait is uploaded. */
function PortraitPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-50 to-neutral-100"
      role="img"
      aria-label={`${name} — portrait coming soon`}
    >
      <span className="text-h2 font-semibold text-primary-700/40">{initials}</span>
    </div>
  );
}
