import { Card, Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/api";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/page/PageHeader";
import { whatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us | CV Putri Palma Nusantara",
  description: "Get in touch with CV Putri Palma Nusantara by email, WhatsApp, or our contact form.",
};

// FR-CONTACT-01/02/03/04/05
export default async function ContactPage() {
  const settings = await getPublicSettings().catch(() => null);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
        title="Contact Us"
        description="Have a question or a specific request? Send us a message and we'll respond promptly."
      />

      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-h2 text-neutral-900">Get in Touch</h2>
            <dl className="mt-6 flex flex-col gap-4">
              {settings?.address && (
                <div>
                  <dt className="text-small font-medium uppercase tracking-wide text-neutral-600">
                    Address
                  </dt>
                  <dd className="mt-1 text-body text-neutral-900">{settings.address}</dd>
                </div>
              )}
              {settings?.whatsapp_number && (
                <div>
                  <dt className="text-small font-medium uppercase tracking-wide text-neutral-600">
                    WhatsApp
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={whatsAppLink(settings.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body text-primary-700 underline underline-offset-4"
                    >
                      {settings.whatsapp_number}
                    </a>
                  </dd>
                </div>
              )}
              {settings?.contact_email && (
                <div>
                  <dt className="text-small font-medium uppercase tracking-wide text-neutral-600">
                    Email
                  </dt>
                  <dd className="mt-1">
                    <a href={`mailto:${settings.contact_email}`} className="text-body text-primary-700 underline underline-offset-4">
                      {settings.contact_email}
                    </a>
                  </dd>
                </div>
              )}
              {settings?.operating_hours && (
                <div>
                  <dt className="text-small font-medium uppercase tracking-wide text-neutral-600">
                    Operating Hours
                  </dt>
                  <dd className="mt-1 text-body text-neutral-900">{settings.operating_hours}</dd>
                </div>
              )}
            </dl>

            {settings?.address && (
              <div className="mt-8 aspect-4/3 overflow-hidden rounded-card">
                <iframe
                  title="Office location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          <Card>
            <h2 className="text-h3 text-neutral-900">Send a Message</h2>
            <ContactForm className="mt-6" />
          </Card>
        </Container>
      </Section>
    </main>
  );
}
