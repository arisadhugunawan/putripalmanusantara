"use client";

import type { TeamMember } from "@ppn/shared-types";
import { teamMemberPhotoAlt } from "@ppn/shared-types";
import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { SafeImage } from "@/components/SafeImage";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Full profile for one team member. Opened from the card only when there is actually more to
 * show than the card already displays — an empty modal would be a dead end.
 *
 * Accessibility (brief item 62): focus moves into the dialog on open, Tab is trapped inside it,
 * Escape closes, and focus returns to the card that opened it.
 */
export function TeamMemberModal({
  member,
  onClose,
  dictionary,
}: {
  member: TeamMember;
  onClose: () => void;
  dictionary: Dictionary;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Wrap at both ends so focus can never escape the dialog into the page behind it.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Newline-separated responsibilities render as a list; a single line stays a paragraph.
  const responsibilities = (member.responsibilities ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  const contacts = [
    member.email && {
      label: dictionary.aboutCompany.team.modalEmailLabel,
      href: `mailto:${member.email}`,
      value: member.email,
      external: false,
    },
    member.phone && {
      label: dictionary.aboutCompany.team.modalPhoneLabel,
      href: `tel:${member.phone.replace(/[^\d+]/g, "")}`,
      value: member.phone,
      external: false,
    },
    member.linkedin_url && {
      label: dictionary.aboutCompany.team.modalLinkedInLabel,
      href: member.linkedin_url,
      value: dictionary.aboutCompany.team.modalLinkedInLinkText,
      external: true,
    },
  ].filter(Boolean) as { label: string; href: string; value: string; external: boolean }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} — ${member.position}`}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[13rem_1fr]">
          <div className="relative aspect-4/5 overflow-hidden bg-neutral-100 sm:h-full">
            <SafeImage media={member.photo} sizes="208px" className="object-cover" />
          </div>

          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {member.department && (
                  <p className="text-small font-medium uppercase tracking-wide text-primary-700">
                    {member.department}
                  </p>
                )}
                <h3 className="mt-1 text-h3 text-neutral-900">{member.name}</h3>
                <p className="mt-0.5 text-body text-neutral-600">{member.position}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={dictionary.aboutCompany.team.modalCloseAriaLabel}
                className="shrink-0 rounded-button p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {member.biography && (
              <p className="mt-4 text-body text-neutral-600">{member.biography}</p>
            )}

            {responsibilities.length > 0 && (
              <div className="mt-5">
                <h4 className="text-small font-medium uppercase tracking-wide text-neutral-500">
                  {dictionary.aboutCompany.team.modalResponsibilitiesHeading}
                </h4>
                {responsibilities.length === 1 ? (
                  <p className="mt-2 text-body text-neutral-700">{responsibilities[0]}</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {responsibilities.map((line) => (
                      <li key={line} className="flex gap-2 text-body text-neutral-700">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Only configured contacts render — never an empty or broken icon (item 39). */}
            {contacts.length > 0 && (
              <div className="mt-5 border-t border-neutral-200 pt-4">
                <dl className="flex flex-col gap-2">
                  {contacts.map((contact) => (
                    <div key={contact.label} className="flex flex-wrap items-baseline gap-x-3">
                      <dt className="w-20 shrink-0 text-small font-medium uppercase tracking-wide text-neutral-500">
                        {contact.label}
                      </dt>
                      <dd className="min-w-0">
                        <a
                          href={contact.href}
                          {...(contact.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="break-all text-body text-primary-700 underline underline-offset-4"
                        >
                          {contact.value}
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * True when the modal would show anything the card does not already show.
 *
 * Reads every text field through `?? ""`: during a rolling deploy the web app can briefly be
 * newer than the API, and a payload without these fields must degrade to "no profile to show"
 * rather than crash the whole About page with a server-side TypeError.
 */
export function hasTeamMemberProfile(member: TeamMember): boolean {
  return Boolean(
    (member.biography ?? "").trim() ||
      (member.responsibilities ?? "").trim() ||
      member.email ||
      member.phone ||
      member.linkedin_url,
  );
}

export { teamMemberPhotoAlt };
