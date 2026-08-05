import { Card, Container, Section } from "@ppn/ui-components";

/** FR-HOME-04 — value propositions. Static copy (not a CMS-modeled entity per docs/04-database.md). */
const VALUES = [
  {
    title: "Consistent Quality",
    description: "Every batch passes quality control checks before packing and shipment.",
  },
  {
    title: "Export Experience",
    description: "Established process for shipping to buyers across multiple continents.",
  },
  {
    title: "Stable Supply Capacity",
    description: "Reliable sourcing network to support recurring, large-volume orders.",
  },
  {
    title: "Responsive Communication",
    description: "Clear, timely responses to quotation requests and buyer inquiries.",
  },
];

export function WhyChooseUsSection() {
  return (
    <Section tone="soft">
      <Container>
        <h2 className="max-w-xl text-h2 text-neutral-900">Why Choose PPN</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <Card key={value.title} className="bg-white">
              <h3 className="text-h3 text-neutral-900">{value.title}</h3>
              <p className="mt-2 text-body text-neutral-600">{value.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
