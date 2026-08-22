import { Card, Container, Section } from "@ppn/ui-components";
import type { DecorativeGraphic, ProductSummary } from "@ppn/shared-types";
import { QuotationForm } from "@/components/forms/QuotationForm";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";

/** FR-HOME-11 / FR-QUOTE-01 — one of the required Request Quotation entry points. Final
 * story beat before the Footer (Homepage UI/UX pass, brief item 33/49), so it gets the
 * strongest closing visual weight: a deep-green backdrop (same family as the Hero's own
 * `primary-700 → primary-900` gradient) with the form itself kept on a plain white `Card`
 * so none of `QuotationForm`'s existing light-background field styling needs touching. */
export function QuotationSection({
  products,
  decorativeGraphics = [],
}: {
  products: ProductSummary[];
  decorativeGraphics?: DecorativeGraphic[];
}) {
  return (
    <Section id="request-quotation" className="relative overflow-hidden bg-linear-to-b from-primary-700 to-neutral-900">
      <DecorativeGraphics graphics={decorativeGraphics} tone="light" />
      <Container className="relative max-w-3xl text-center">
        <FadeUpSection>
          <p className="flex items-center justify-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-100">
            <span aria-hidden="true" className="h-px w-8 bg-primary-100/60" />
            Let&apos;s Work Together
            <span aria-hidden="true" className="h-px w-8 bg-primary-100/60" />
          </p>
          <h2 className="mt-3 text-h2 text-white">Request a Quotation</h2>
          <p className="mt-3 text-body-lg text-primary-50/90">
            Tell us what you need and our team will get back to you with pricing and availability.
          </p>
        </FadeUpSection>
        <FadeUpSection style={{ transitionDelay: "100ms" }}>
          <Card className="mt-8 text-left shadow-premium">
            <QuotationForm sourcePage="/" products={products} />
          </Card>
        </FadeUpSection>
      </Container>
    </Section>
  );
}
