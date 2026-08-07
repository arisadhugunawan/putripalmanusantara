import { Card, Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getProducts, getPublicSettings } from "@/lib/api";
import { ContactCompanyPanel } from "@/components/contact/ContactCompanyPanel";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactInquiryForm } from "@/components/contact/ContactInquiryForm";
import { ContactMap } from "@/components/contact/ContactMap";
import { QuickContactCards } from "@/components/contact/QuickContactCards";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { localBusinessJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Contact Us",
    description:
      "Get in touch with CV Putri Palma Nusantara's export team by email, WhatsApp, or our inquiry form — we respond promptly to buyer requests worldwide.",
    path: "/contact",
    locale,
  });
}

// FR-CONTACT-01/02/03/04/05 — premium Contact page: hero, company info + map, inquiry
// form, and quick-contact CTAs. Header, Footer, Homepage, About, Products, and Facilities
// are untouched.
export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const [settings, products] = await Promise.all([
    getPublicSettings(locale).catch(() => null),
    getProducts(locale).catch(() => []),
  ]);

  return (
    <main>
      <JsonLd data={localBusinessJsonLd(settings, locale)} />
      <ContactHero />

      <Section>
        <Container className="grid grid-cols-1 gap-14 lg:grid-cols-[0.82fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-10">
            <ContactCompanyPanel settings={settings} />

            {settings?.address && (
              <FadeUpSection>
                <ContactMap address={settings.address} />
              </FadeUpSection>
            )}
          </div>

          <Card className="h-fit">
            <h2 className="text-h3 text-neutral-900">Send Us an Inquiry</h2>
            <p className="mt-1.5 text-body text-neutral-600">
              Tell us what you need and our export team will respond with pricing and
              availability.
            </p>
            <ContactInquiryForm products={products} className="mt-6" />
          </Card>
        </Container>
      </Section>

      <Section tone="soft">
        <Container>
          <h2 className="text-center text-h2 text-neutral-900">Prefer a Faster Way to Reach Us?</h2>
          <div className="mt-10">
            <QuickContactCards settings={settings} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
