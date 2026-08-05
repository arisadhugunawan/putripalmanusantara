import { Card, Container, Section, buttonVariants } from "@ppn/ui-components";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";
import { getFacilities } from "@/lib/api";
import { AboutNav, type AboutSection } from "@/components/about/AboutNav";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "About Us",
    description:
      "CV Putri Palma Nusantara is an Indonesian exporter of coconut-derived products, connecting local producers with international buyers.",
    path: "/about",
    locale,
  });
}

const VALUES = [
  { title: "Integrity", description: "Transparent communication and honest representation of our products and capacity." },
  { title: "Quality First", description: "Every batch is checked against consistent quality standards before shipment." },
  { title: "Reliability", description: "Dependable supply capacity buyers can plan around." },
  { title: "Sustainability", description: "Sourcing practices that respect the communities and land we work with." },
];

const SECTIONS: AboutSection[] = [
  { id: "company", label: "CV. Putri Palma Nusantara" },
  { id: "team", label: "PPN Team" },
  { id: "what-we-do", label: "What We Do?" },
  { id: "legal", label: "Legal & Certificate" },
  { id: "factory", label: "Factory" },
];

// FR-ABOUT-01/03/04. FR-ABOUT-02 (certifications) is omitted — none are on file yet;
// the CMS Settings module (Phase 5) lets the client add certification badges later.
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const facilities = await getFacilities(locale);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About Us" }]}
        title="About CV Putri Palma Nusantara"
        locale={locale}
      />

      <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-16 lg:py-20">
        <AboutNav sections={SECTIONS} />

        <div className="flex flex-col gap-20 lg:gap-28">
          {/* CV. Putri Palma Nusantara */}
          <section id="company" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">CV. Putri Palma Nusantara</h2>
              <p className="mt-6 text-body-lg text-neutral-600">
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

              <h3 className="mt-10 text-h3 text-neutral-900">Our Mission</h3>
              <p className="mt-3 text-body-lg text-neutral-600">
                To be a trusted, transparent supply partner for international buyers of coconut
                products, delivering consistent quality from sourcing through to export.
              </p>

              <h3 className="mt-10 text-h3 text-neutral-900">Our Values</h3>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {VALUES.map((value) => (
                  <Card key={value.title} className="bg-neutral-50">
                    <h4 className="text-body-lg font-medium text-neutral-900">{value.title}</h4>
                    <p className="mt-1.5 text-body text-neutral-600">{value.description}</p>
                  </Card>
                ))}
              </div>
            </FadeUpSection>
          </section>

          {/* PPN Team */}
          <section id="team" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">PPN Team</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Our team brings together experienced people across sourcing, quality control,
                logistics, and international trade coordination, working together to make sure
                every shipment meets the standard our buyers expect. Individual team profiles
                will be added here as they become available.
              </p>
            </FadeUpSection>
          </section>

          {/* What We Do? */}
          <section id="what-we-do" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">What We Do?</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                We source, process, and export four core coconut product lines — Semi Husked
                Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — through a
                consistent production process: sourcing from trusted local farmers, sorting and
                quality control, packing to buyer specification, and container stuffing for
                export shipment.
              </p>
              <Link href="/production-process" className={`mt-6 inline-flex ${buttonVariants("secondary", "md")}`}>
                See Our Production Process
              </Link>
            </FadeUpSection>
          </section>

          {/* Legal & Certificate — FR-ABOUT-02 — badges render here once the client
              provides certification documents; an honest "coming soon" state instead of
              fabricated badges (same pattern as the Hero's not-yet-provided video). */}
          <section id="legal" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">Legal & Certificate</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Legal registration details and product certifications will be listed here as
                they are provided. Buyers needing legality or certification documentation ahead
                of an order can request it directly via our contact form.
              </p>
              <Link href="/contact" className={`mt-6 inline-flex ${buttonVariants("secondary", "md")}`}>
                Contact Us
              </Link>
            </FadeUpSection>
          </section>

          {/* Factory — real facility names pulled from the CMS, not fabricated; full
              photos/details live on the dedicated Facilities page. */}
          <section id="factory" className="scroll-mt-24">
            <FadeUpSection>
              <h2 className="text-h2 text-neutral-900">Factory</h2>
              <p className="mt-6 max-w-2xl text-body-lg text-neutral-600">
                Our production site is built around purpose-specific facilities that support
                consistent, export-ready output at every stage.
              </p>
              {facilities.length > 0 && (
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {facilities.map((facility) => (
                    <li
                      key={facility.id}
                      className="rounded-field border border-neutral-200 px-4 py-3 text-body font-medium text-neutral-900"
                    >
                      {facility.name}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/facilities" className={`mt-6 inline-flex ${buttonVariants("secondary", "md")}`}>
                View Facilities & Photos
              </Link>
            </FadeUpSection>
          </section>
        </div>
      </Container>

      <Section tone="soft">
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
