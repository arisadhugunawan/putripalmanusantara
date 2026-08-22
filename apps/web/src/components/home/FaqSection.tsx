import { Accordion, Container, Section } from "@ppn/ui-components";
import type { DecorativeGraphic, Faq } from "@ppn/shared-types";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";

/** FR-HOME-10 / FR-FAQ-01/02. */
export function FaqSection({
  faqs,
  decorativeGraphics = [],
}: {
  faqs: Faq[];
  decorativeGraphics?: DecorativeGraphic[];
}) {
  if (faqs.length === 0) return null;

  return (
    <Section tone="soft" className="relative overflow-hidden">
      <DecorativeGraphics graphics={decorativeGraphics} />
      <Container className="relative max-w-3xl">
        <FadeUpSection className="text-center">
          <p className="flex items-center justify-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
            Common Questions
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
          </p>
          <h2 className="mt-3 text-h2 text-neutral-900">Frequently Asked Questions</h2>
        </FadeUpSection>
        <FadeUpSection className="mt-10" style={{ transitionDelay: "100ms" }}>
          <Accordion items={faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer }))} />
        </FadeUpSection>
      </Container>
    </Section>
  );
}
