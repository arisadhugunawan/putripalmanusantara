import type { AboutCompanyFacilitiesFaqSection, FacilitiesFaqItem } from "@ppn/shared-types";
import { buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";
import { faqPageJsonLd } from "@/lib/json-ld";
import { FacilitiesFaqAccordion } from "./FacilitiesFaqAccordion";

/** "FAQ" panel on `/facilities` — a dedicated, premium accordion (not the shared `Faq` model
 * that also feeds the Homepage). Same contained `rounded-3xl` panel treatment as
 * `MoqPaymentTermsSection.tsx`/`ShipmentTermsSection.tsx`, with a large slow-floating blurred
 * circle behind the intro column and a faint coconut-tree corner accent. */
export function FacilitiesFaqSection({
  section,
  items,
}: {
  section: AboutCompanyFacilitiesFaqSection;
  items: FacilitiesFaqItem[];
}) {
  const CoconutTreeSilhouette = DECORATIVE_SVGS.coconut_tree_silhouette;
  const jsonLd = faqPageJsonLd(items);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-linear-to-b from-white via-primary-50/20 to-white p-6 sm:p-10">
      {items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(74,101,30,0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-linear-to-br from-primary-500/20 via-accent-500/10 to-transparent blur-3xl"
        style={{ animation: "facilities-faq-float 13s ease-in-out infinite" }}
      />
      <CoconutTreeSilhouette
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-8 h-56 w-56 text-primary-900 opacity-[0.04]"
      />

      <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[30%_70%] lg:gap-12">
        <div>
          <FadeUpSection>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
              {section.eyebrow}
            </p>
            <h2 className="mt-4 text-h2 text-neutral-900">{section.heading}</h2>
          </FadeUpSection>
          <FadeUpSection style={{ transitionDelay: "100ms" }}>
            <p className="mt-3 text-body-lg text-neutral-600">{section.description}</p>
          </FadeUpSection>

          {items.length > 0 && (
            <FadeUpSection style={{ transitionDelay: "160ms" }} className="mt-8 hidden flex-wrap gap-2 lg:flex">
              {items.map((_, index) => (
                <span
                  key={index}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-small text-neutral-400"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              ))}
            </FadeUpSection>
          )}
        </div>

        <FacilitiesFaqAccordion items={items} accordionMode={section.accordion_mode} />
      </div>

      <FadeUpSection style={{ transitionDelay: "200ms" }} className="relative mt-12 rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
        <h3 className="text-h3 text-neutral-900">{section.cta_title}</h3>
        <p className="mx-auto mt-2 max-w-xl text-body text-neutral-600">{section.cta_description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={section.cta_primary_href}
            className={`group inline-flex items-center gap-2 ${buttonVariants("primary", "md")}`}
          >
            {section.cta_primary_label}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
          {section.cta_secondary_href && (
            <Link
              href={section.cta_secondary_href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-2 ${buttonVariants("secondary", "md")}`}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:scale-110">
                <path
                  d="M17 14.2c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.6.9-.8 1-.1.2-.3.2-.6.1-.8-.4-1.6-.9-2.3-1.5-.6-.6-1.1-1.3-1.6-2-.1-.2 0-.4.1-.5.1-.1.3-.3.4-.5.1-.1.2-.3.1-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.4.1 1.1.5 2.1 1.2 3.1 1.3 1.9 2.9 3.4 4.9 4.3.6.3 1.1.4 1.7.6.7.2 1.3.2 1.9.1.7-.1 1.6-.7 1.9-1.4.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3Z"
                  fill="currentColor"
                />
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
              </svg>
              {section.cta_secondary_label}
            </Link>
          )}
        </div>
      </FadeUpSection>
    </div>
  );
}
