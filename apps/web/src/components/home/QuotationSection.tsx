import { Card, Container, Section } from "@ppn/ui-components";
import type { DecorativeGraphic, ProductSummary } from "@ppn/shared-types";
import type { Dictionary } from "@/i18n/dictionary.d";
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
  dictionary,
}: {
  products: ProductSummary[];
  decorativeGraphics?: DecorativeGraphic[];
  dictionary: Dictionary;
}) {
  return (
    <Section id="request-quotation" className="relative overflow-hidden bg-linear-to-b from-primary-700 to-neutral-900">
      <DecorativeGraphics graphics={decorativeGraphics} tone="light" />
      <Container className="relative max-w-3xl text-center">
        <FadeUpSection>
          <p className="flex items-center justify-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-100">
            <span aria-hidden="true" className="h-px w-8 bg-primary-100/60" />
            {dictionary.home.quotation.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-primary-100/60" />
          </p>
          <h2 className="mt-3 text-h2 text-white">{dictionary.home.quotation.heading}</h2>
          <p className="mt-3 text-body-lg text-primary-50/90">
            {dictionary.home.quotation.description}
          </p>
        </FadeUpSection>
        <FadeUpSection style={{ transitionDelay: "100ms" }}>
          {/* mb-24 sm:mb-0 — this is the last interactive content before the Footer, so on
              mobile (where the submit button is full-width, `w-full` below `sm`) it can rest
              at the exact viewport position the floating WhatsApp/AI widgets occupy; the extra
              margin keeps the submit button clear of that fixed bottom-right zone. */}
          <Card className="mt-8 mb-24 text-left shadow-premium sm:mb-0">
            <QuotationForm sourcePage="/" products={products} dictionary={dictionary} />
          </Card>
        </FadeUpSection>
      </Container>
    </Section>
  );
}
