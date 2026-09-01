"use client";

import { Container } from "@ppn/ui-components";
import { teamMemberPhotoAlt, type TeamMember } from "@ppn/shared-types";
import Image from "next/image";
import { Link } from "@/i18n/Link";
import { CoconutMark } from "@/components/SafeImage";

/** "Team" is a virtual gallery category (brief §30) — real cards straight from the About
 * Company Team module, never duplicated into GalleryItem rows. Hover reveals name/position;
 * clicking goes to the real Team page. */
export function GalleryTeamCategoryPanel({ members }: { members: TeamMember[] }) {
  const active = members.filter((member) => member.active);
  if (active.length === 0) return null;

  return (
    <Container className="py-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {active.map((member) => (
          <Link
            key={member.id}
            href="/about/team"
            className="group block overflow-hidden rounded-card bg-neutral-100 shadow-[0_16px_40px_-20px_rgba(24,61,43,0.3)]"
          >
            <div className="relative aspect-4/5 w-full bg-linear-to-br from-primary-50 to-neutral-100">
              {member.photo ? (
                <Image
                  src={member.photo.file_url}
                  alt={teamMemberPhotoAlt(member)}
                  fill
                  sizes="(min-width: 1024px) 24vw, 46vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={teamMemberPhotoAlt(member)}>
                  <CoconutMark className="h-10 w-10 text-primary-600/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-neutral-900/70 via-neutral-900/0 to-neutral-900/0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
              <div className="absolute inset-x-3 bottom-3 translate-y-1.5 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-small font-semibold text-white">{member.name}</p>
                <p className="text-small text-white/80">{member.position}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
