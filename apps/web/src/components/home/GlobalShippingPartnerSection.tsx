import type { DecorativeGraphic, HomepageShippingSection, ShippingPartner } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { ShippingPartnerMarquee } from "./shipping-partners/ShippingPartnerMarquee";

/**
 * "Global Shipping Partner" — infinite logo carousel of shipping/logistics partners,
 * immediately after Global Export Reach. Fully CMS-driven: renders nothing until at least
 * one Active + Featured shipping partner exists, same convention as every other Homepage
 * section in this project — no shipping line/carrier logos are ever implied by an empty
 * carousel shell.
 */
export function GlobalShippingPartnerSection({
  section,
  partners,
  decorativeGraphics,
}: {
  section: HomepageShippingSection;
  partners: ShippingPartner[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (!section.enabled || partners.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#F2F7F2] py-(--spacing-section-y-comfortable)">
      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-primary-300" />
            <h2 className="text-h2 text-neutral-900">
              {section.title.split(/(shipping)/i).map((part, i) =>
                /^shipping$/i.test(part) ? (
                  <span key={i} className="text-primary-700">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </h2>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-neutral-600">{section.subtitle}</p>
        </div>

        <div className="mt-10 md:mt-14">
          <ShippingPartnerMarquee section={section} partners={partners} />
        </div>
      </Container>
    </section>
  );
}
