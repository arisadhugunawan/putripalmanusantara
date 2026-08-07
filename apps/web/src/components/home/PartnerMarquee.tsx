import type { PartnerLogo } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Image from "next/image";

/**
 * Trusted-partners infinite logo marquee — pure CSS (no JS animation loop), pauses on
 * hover via `animation-play-state`. Renders nothing when the CMS has no enabled logos: no
 * placeholder/government-institution logos are hardcoded here (see README — displaying one
 * would imply a confirmed real partnership no one has confirmed).
 */
export function PartnerMarquee({ logos }: { logos: PartnerLogo[] }) {
  if (logos.length === 0) return null;

  // Duplicated once so a 50% translateX loop is seamless regardless of logo count.
  const track = [...logos, ...logos];

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-12">
      <Container>
        <p className="text-center text-small font-medium uppercase tracking-wide text-neutral-500">
          Trusted Partners &amp; Government Institutions
        </p>
      </Container>

      <div className="group relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max items-center gap-16 group-hover:[animation-play-state:paused]">
          {track.map((logo, index) => {
            const image = (
              <Image
                src={logo.logo.file_url}
                alt={logo.logo.alt_text || logo.partner_name}
                width={140}
                height={64}
                className="h-12 w-auto object-contain grayscale transition-all duration-300 hover:scale-105 hover:grayscale-0"
              />
            );
            return (
              <div key={`${logo.id}-${index}`} className="shrink-0">
                {logo.website_url ? (
                  <a href={logo.website_url} target="_blank" rel="noopener noreferrer" aria-label={logo.partner_name}>
                    {image}
                  </a>
                ) : (
                  image
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
