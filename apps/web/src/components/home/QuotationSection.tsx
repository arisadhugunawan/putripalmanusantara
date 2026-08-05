import { Card, Container, Section } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import { QuotationForm } from "@/components/forms/QuotationForm";

/** FR-HOME-11 / FR-QUOTE-01 — one of the required Request Quotation entry points. */
export function QuotationSection({ products }: { products: ProductSummary[] }) {
  return (
    <Section id="request-quotation">
      <Container className="max-w-3xl">
        <h2 className="text-h2 text-neutral-900">Request a Quotation</h2>
        <p className="mt-2 text-body-lg text-neutral-600">
          Tell us what you need and our team will get back to you with pricing and availability.
        </p>
        <Card className="mt-8">
          <QuotationForm sourcePage="/" products={products} />
        </Card>
      </Container>
    </Section>
  );
}
