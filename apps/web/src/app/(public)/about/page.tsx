import { Card, Container, Section, buttonVariants } from "@ppn/ui-components";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "CV Putri Palma Nusantara is an Indonesian exporter of coconut-derived products, connecting local producers with international buyers.",
  path: "/about",
});

const VALUES = [
  { title: "Integrity", description: "Transparent communication and honest representation of our products and capacity." },
  { title: "Quality First", description: "Every batch is checked against consistent quality standards before shipment." },
  { title: "Reliability", description: "Dependable supply capacity buyers can plan around." },
  { title: "Sustainability", description: "Sourcing practices that respect the communities and land we work with." },
];

// FR-ABOUT-01/03/04. FR-ABOUT-02 (certifications) is omitted — none are on file yet;
// the CMS Settings module (Phase 5) lets the client add certification badges later.
export default function AboutPage() {
  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About Us" }]}
        title="About CV Putri Palma Nusantara"
      />

      <Section>
        <Container className="max-w-3xl">
          <h2 className="text-h2 text-neutral-900">Who We Are</h2>
          <p className="mt-4 text-body-lg text-neutral-600">
            CV Putri Palma Nusantara is an Indonesian exporter of coconut-derived products,
            connecting local coconut-producing regions with importers, distributors,
            wholesalers, food manufacturers, and trading companies across Asia, the Middle
            East, and Europe.
          </p>
          <p className="mt-4 text-body-lg text-neutral-600">
            We focus on four core product lines — Semi Husked Coconut, Copra, Coconut Shell
            Charcoal, and Coconut Timber — supported by a consistent production process and
            dependable supply capacity.
          </p>

          <h2 className="mt-12 text-h2 text-neutral-900">Our Mission</h2>
          <p className="mt-4 text-body-lg text-neutral-600">
            To be a trusted, transparent supply partner for international buyers of coconut
            products, delivering consistent quality from sourcing through to export.
          </p>
        </Container>
      </Section>

      <Section tone="soft">
        <Container>
          <h2 className="text-h2 text-neutral-900">Our Values</h2>
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

      <Section>
        <Container className="text-center">
          <h2 className="text-h2 text-neutral-900">Ready to work with us?</h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-neutral-600">
            Tell us what you need and our team will respond with pricing and availability.
          </p>
          <Link href="/#request-quotation" className={`mt-6 inline-flex ${buttonVariants("primary", "lg")}`}>
            Request Quotation
          </Link>
        </Container>
      </Section>
    </main>
  );
}
