import {
  Accordion,
  Badge,
  Button,
  Card,
  Container,
  FieldError,
  Input,
  Label,
  Section,
  Textarea,
} from "@ppn/ui-components";

const FAQ_ITEMS = [
  { id: "1", question: "What products does PPN export?", answer: "Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber." },
  { id: "2", question: "Which countries do you ship to?", answer: "Thailand, Malaysia, China, India, the Middle East, and Europe." },
];

export default function DesignSystemShowcase() {
  return (
    <main className="flex-1">
      <Section>
        <Container className="flex flex-col gap-16">
          <div>
            <p className="text-small uppercase tracking-wide text-neutral-600">Phase 3 — Design System Preview</p>
            <h1 className="text-h1 text-neutral-900">Design tokens & base components</h1>
            <p className="mt-4 max-w-2xl text-body-lg text-neutral-600">
              This page exists only to visually verify the design system built in Phase 3. It
              will be replaced by the real Homepage in Phase 4.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-neutral-900">Buttons</h2>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Request Quotation</Button>
              <Button variant="secondary">View Products</Button>
              <Button variant="ghost">Learn more</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-neutral-900">Badges</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="neutral">Draft</Badge>
              <Badge variant="primary">Published</Badge>
              <Badge variant="accent">New</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-neutral-900">Cards</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {["Semi Husked Coconut", "Copra", "Coconut Shell Charcoal"].map((name) => (
                <Card key={name} hoverable>
                  <h3 className="text-h3 text-neutral-900">{name}</h3>
                  <p className="mt-2 text-body text-neutral-600">
                    Export-ready product, sorted and quality-checked before shipment.
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-neutral-900">Form fields</h2>
            <Card className="max-w-lg">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="demo-name">Name</Label>
                  <Input id="demo-name" placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="demo-email">Email</Label>
                  <Input id="demo-email" type="email" invalid defaultValue="not-an-email" />
                  <FieldError>Please enter a valid email address.</FieldError>
                </div>
                <div>
                  <Label htmlFor="demo-message">Message</Label>
                  <Textarea id="demo-message" placeholder="Tell us what you need" />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-neutral-900">Accordion (FAQ)</h2>
            <Accordion items={FAQ_ITEMS} className="max-w-2xl" />
          </div>
        </Container>
      </Section>

      <Section tone="soft">
        <Container>
          <h2 className="text-h2 text-neutral-900">Soft-tint section</h2>
          <p className="mt-2 max-w-xl text-body text-neutral-600">
            Used sparingly for section rhythm, per docs/03-design.md §2.1.
          </p>
        </Container>
      </Section>
    </main>
  );
}
