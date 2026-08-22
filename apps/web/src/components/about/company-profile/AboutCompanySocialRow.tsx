import type { AboutCompanySocialLink } from "@ppn/shared-types";
import { SocialIcon } from "./SocialIcons";

/** Section 8/10/11 of the redesign brief — "Connect With PPN". Only ever renders a real,
 * Admin-configured + Active link (never a fabricated URL). Each button meets the 44×44px
 * minimum touch target regardless of viewport, and exposes a native tooltip via `title` plus
 * an `aria-label` for screen readers. */
export function AboutCompanySocialRow({
  links,
  label,
}: {
  links: AboutCompanySocialLink[];
  label: string;
}) {
  const active = links.filter((link) => link.active && link.url.trim());
  if (active.length === 0) return null;

  return (
    <div>
      {label && <p className="text-small font-medium tracking-[0.1em] text-neutral-500 uppercase">{label}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {active.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target={link.open_in_new_tab ? "_blank" : undefined}
            rel={link.open_in_new_tab ? "noopener noreferrer" : undefined}
            title={link.display_name}
            aria-label={link.display_name}
            className="group flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-all duration-250 ease-out hover:-translate-y-0.5 hover:border-[#245C3A] hover:bg-[#245C3A] hover:text-white"
          >
            <span className="transition-transform duration-250 ease-out group-hover:scale-110">
              <SocialIcon platform={link.platform} size={19} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
