import type { AboutCompanyWhatWeDoSection, WhatWeDoItem, WhoWeSupplyItem } from "@ppn/shared-types";
import { FadeUpSection } from "./FadeUpSection";
import { WhatWeSupplyCarousel } from "./WhatWeSupplyCarousel";
import { WhatWeSupplyDecorative } from "./WhatWeSupplyDecorative";
import { WhoWeSupplySection } from "./WhoWeSupplySection";

/**
 * Section 03 — redesigned from a plain "What We Do?" grid into "What We Supply": a header
 * (Admin-editable via `AboutCompanyWhatWeDoSection`), a premium horizontal auto-scrolling
 * product showcase that links to the real product catalogue, and a "Who We Supply"
 * audience-segment sub-block — all still living under the one `what_we_do` section key (see
 * README) rather than becoming new top-level sections, since the section-navigator system is a
 * fixed 5-key union. The Buyer CTA ("Looking for Coconut Products?") and Supplier CTA ("Want to
 * Supply PPN?") blocks were removed on user request to declutter the section — their copy still
 * lives in `AboutCompanyWhatWeDoSection` and stays Admin-editable, simply unused here, same
 * pattern as the Contact page's own Buyer/Supplier CTA removal earlier in this project.
 */
export function WhatWeDoSection({
  section,
  items,
  whoWeSupplyItems,
}: {
  section: AboutCompanyWhatWeDoSection;
  items: WhatWeDoItem[];
  whoWeSupplyItems: WhoWeSupplyItem[];
}) {
  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {/* 01 — What We Supply: header + product showcase carousel */}
      <div className="relative -mx-4 overflow-hidden px-4 py-2 sm:-mx-6 sm:px-6">
        <WhatWeSupplyDecorative />
        <FadeUpSection className="relative">
          <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-[#245C3A]">
            <span className="h-px w-8 bg-[#6FAF3A]" aria-hidden="true" />
            {section.eyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl text-balance text-h2 text-neutral-900">{section.heading}</h2>
          {section.description && (
            <p className="mt-3 max-w-2xl text-body-lg text-neutral-600">{section.description}</p>
          )}

          {items.length === 0 ? (
            <p className="mt-10 max-w-2xl text-body-lg text-neutral-600">
              PPN product information is currently being updated.
            </p>
          ) : (
            <div className="mt-10">
              <WhatWeSupplyCarousel items={items} />
            </div>
          )}
        </FadeUpSection>
      </div>

      {/* 02 — Who We Supply */}
      <WhoWeSupplySection
        heading={section.who_heading}
        description={section.who_description}
        items={whoWeSupplyItems}
      />
    </div>
  );
}
