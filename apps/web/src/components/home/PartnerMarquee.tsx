import type { DecorativeGraphic, HomepagePartnersSection, PartnerLogo } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { PartnerLogoTile } from "./PartnerLogoTile";

/**
 * "Trusted Institutions & Partners" — infinite CSS logo marquee (no JS animation loop),
 * admin-configurable title/subtitle/speed, pauses on hover (desktop), and falls back to a
 * static wrapped grid under `prefers-reduced-motion: reduce` (both markups are rendered
 * server-side; only one is ever visible, toggled purely by Tailwind's motion-safe/
 * motion-reduce variants — no client JS needed to detect the preference). Renders nothing
 * when the section is disabled or the CMS has no featured+active logos: no
 * placeholder/government-institution logos are hardcoded here (see README — displaying one
 * would imply a confirmed real partnership no one has confirmed, and the brief this shipped
 * with is explicit that unofficial/invented government logos must never be used).
 */
export function PartnerMarquee({
  section,
  logos,
  decorativeGraphics,
}: {
  section: HomepagePartnersSection;
  logos: PartnerLogo[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (!section.enabled || logos.length === 0) return null;

  // Duplicated once so a 50% translateX loop is seamless regardless of logo count (works
  // the same whether there are 4 logos or 50).
  const track = [...logos, ...logos];
  const marqueeStyle = { "--marquee-duration": `${section.marquee_duration_seconds}s` } as React.CSSProperties;

  return (
    <section className="relative overflow-hidden bg-primary-50/40 py-(--spacing-section-y-compact)">
      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <h2 className="text-center text-small font-medium uppercase tracking-wide text-primary-700">{section.title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-body-lg text-neutral-600">{section.subtitle}</p>
      </Container>

      {/* Reduced motion: static wrapped grid, original (non-duplicated) list. */}
      <Container className="relative mt-8 motion-safe:hidden">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {logos.map((logo) => (
            <PartnerLogoTile key={logo.id} logo={logo} />
          ))}
        </div>
      </Container>

      {/* Default: animated infinite marquee. */}
      <div
        className="group relative mt-8 motion-reduce:hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <div
          style={marqueeStyle}
          className="animate-marquee flex w-max items-center gap-6 will-change-transform group-hover:[animation-play-state:paused]"
        >
          {track.map((logo, index) => (
            <PartnerLogoTile key={`${logo.id}-${index}`} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}
