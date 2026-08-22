import type { WhoWeSupplyItem } from "@ppn/shared-types";
import { FadeUpSection } from "./FadeUpSection";
import { WhoWeSupplyIcon } from "./WhoWeSupplyIcons";

/**
 * "Who We Supply" — audience segments (Importers/Manufacturers/Distributors/Industrial Users/
 * Long-term Partners) as a horizontal storytelling row on desktop with a connecting line behind
 * the icon badges, collapsing to a vertical timeline on mobile/tablet. Each item staggers in via
 * its own `FadeUpSection` (opacity + translateY, 100ms stagger) — the same IntersectionObserver
 * + CSS-transition mechanism used everywhere else on this page, so the global
 * `prefers-reduced-motion` rule neutralizes it automatically with no extra logic here.
 */
export function WhoWeSupplySection({
  heading,
  description,
  items,
}: {
  heading: string;
  description: string;
  items: WhoWeSupplyItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="max-w-2xl">
        {heading && <h2 className="text-balance text-h2 text-neutral-900">{heading}</h2>}
        {description && <p className="mt-3 text-body-lg text-neutral-600">{description}</p>}
      </div>

      {/* Desktop — horizontal row, connecting line behind the icon badges */}
      <div className="relative mt-12 hidden lg:grid lg:grid-cols-5 lg:gap-4">
        <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-8 h-px bg-neutral-200" />
        {items.map((item, index) => (
          <FadeUpSection key={item.id} style={{ transitionDelay: `${Math.min(index, 8) * 100}ms` }}>
            <div className="group relative flex flex-col items-center px-2 text-center">
              <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#245C3A] shadow-card transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#245C3A] group-hover:bg-[#245C3A] group-hover:text-white group-hover:shadow-[0_16px_32px_-16px_rgba(24,61,43,0.4)]">
                <WhoWeSupplyIcon icon={item.icon} size={26} />
              </span>
              <span className="mt-4 text-small font-semibold tracking-[0.1em] text-[#6FAF3A]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-1.5 text-body-lg font-medium text-neutral-900">{item.title}</p>
              {item.description && <p className="mt-2 text-small text-neutral-600">{item.description}</p>}
            </div>
          </FadeUpSection>
        ))}
      </div>

      {/* Mobile/tablet — vertical timeline */}
      <div className="relative mt-10 flex flex-col gap-8 lg:hidden">
        <div aria-hidden="true" className="absolute bottom-4 left-8 top-4 w-px bg-neutral-200" />
        {items.map((item, index) => (
          <FadeUpSection key={item.id} style={{ transitionDelay: `${Math.min(index, 8) * 100}ms` }}>
            <div className="relative flex items-start gap-4">
              <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#245C3A] shadow-card">
                <WhoWeSupplyIcon icon={item.icon} size={26} />
              </span>
              <div className="pt-2">
                <span className="text-small font-semibold tracking-[0.1em] text-[#6FAF3A]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-body-lg font-medium text-neutral-900">{item.title}</p>
                {item.description && <p className="mt-1.5 text-small text-neutral-600">{item.description}</p>}
              </div>
            </div>
          </FadeUpSection>
        ))}
      </div>
    </div>
  );
}
