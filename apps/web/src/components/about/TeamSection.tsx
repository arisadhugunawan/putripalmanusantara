import type { AboutCompanyTeamSection, TeamMember } from "@ppn/shared-types";
import { buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { FadeUpSection } from "./FadeUpSection";
import { TeamGrid } from "./team/TeamGrid";

/**
 * Section 02 — "PPN Team".
 *
 * `members` is already active-only and order-sorted: it comes straight from the published
 * snapshot, which applies that filter at publish time (see `buildSnapshotPayload`), so a draft
 * or deactivated member can never reach this component.
 *
 * All copy is CMS-driven. When no members exist yet the grid is replaced by a plain statement
 * rather than placeholder people — this project never ships invented names or portraits.
 */
export function TeamSection({
  members,
  section,
  dictionary,
}: {
  members: TeamMember[];
  section: AboutCompanyTeamSection;
  dictionary: Dictionary;
}) {
  return (
    <div className="relative overflow-hidden rounded-card bg-linear-to-b from-white to-primary-50/40 p-6 sm:p-8 lg:p-10">
      {/* Decorative frond, ~4% opacity — background only, never competing with the portraits. */}
      <FrondDecor className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 text-primary-700/[0.04]" />

      <div className="relative">
        <FadeUpSection>
          <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span className="h-px w-8 origin-left bg-primary-600" aria-hidden="true" />
            {section.eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-h2 text-neutral-900">{section.heading}</h2>
          {section.description && (
            <p className="mt-4 max-w-2xl text-body-lg text-neutral-600">{section.description}</p>
          )}
          {/* Counter is derived from the published members, never a hard-coded number. */}
          {section.show_counter && members.length > 0 && (
            <p className="mt-3 text-small font-medium uppercase tracking-wide text-primary-600">
              {members.length}{" "}
              {members.length !== 1 ? dictionary.aboutCompany.team.memberPlural : dictionary.aboutCompany.team.memberSingular}
            </p>
          )}
        </FadeUpSection>

        {members.length === 0 ? (
          <p className="mt-7 max-w-2xl text-body-lg text-neutral-600">{dictionary.aboutCompany.team.emptyState}</p>
        ) : (
          <TeamGrid members={members} dictionary={dictionary} />
        )}

        {section.cta_label && section.cta_href && (
          <FadeUpSection>
            <Link href={section.cta_href} className={`mt-9 inline-flex ${buttonVariants("secondary", "md")}`}>
              {section.cta_label}
            </Link>
          </FadeUpSection>
        )}
      </div>
    </div>
  );
}

function FrondDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M20 180C60 120 120 70 190 40" />
      <path d="M64 128c-6-24-2-48 10-70M92 100c-2-26 6-50 22-70M126 76c2-24 14-44 34-58" />
    </svg>
  );
}
