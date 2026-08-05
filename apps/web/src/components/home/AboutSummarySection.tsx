import { Container, Section, buttonVariants } from "@ppn/ui-components";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";

/** FR-HOME-03 — condensed company profile with a link to the full About page. */
export function AboutSummarySection() {
  return (
    <Section>
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-4/3 overflow-hidden rounded-card">
          <SafeImage media={null} />
        </div>
        <div>
          <p className="text-small font-medium uppercase tracking-wide text-primary-700">
            About Us
          </p>
          <h2 className="mt-2 text-h2 text-neutral-900">
            A dependable partner for coconut product sourcing.
          </h2>
          <p className="mt-4 max-w-xl text-body-lg text-neutral-600">
            CV Putri Palma Nusantara connects Indonesia&apos;s coconut-producing regions with
            international buyers, combining consistent quality control with dependable supply
            capacity — from raw material sourcing through to export-ready shipment.
          </p>
          <Link href="/about" className={`mt-6 inline-flex ${buttonVariants("secondary", "md")}`}>
            Learn More
          </Link>
        </div>
      </Container>
    </Section>
  );
}
