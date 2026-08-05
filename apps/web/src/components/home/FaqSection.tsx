import { Accordion, Container, Section } from "@ppn/ui-components";
import type { Faq } from "@ppn/shared-types";

/** FR-HOME-10 / FR-FAQ-01/02. */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <Section tone="soft">
      <Container className="max-w-3xl">
        <h2 className="text-h2 text-neutral-900">Frequently Asked Questions</h2>
        <div className="mt-10">
          <Accordion items={faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer }))} />
        </div>
      </Container>
    </Section>
  );
}
