import { Container } from "@ppn/ui-components";
import Link from "next/link";
import { getPublicSettings } from "@/lib/api";
import { whatsAppLink } from "@/lib/whatsapp";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/production-process", label: "Production Process" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact Us" },
];

export async function Footer() {
  const settings = await getPublicSettings().catch(() => null);

  return (
    <footer className="border-t border-neutral-200 bg-neutral-100">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="flex flex-col gap-3">
          <span className="text-h3 font-heading font-bold text-neutral-900">
            {settings?.company_name ?? "CV Putri Palma Nusantara"}
          </span>
          <p className="text-body text-neutral-600">
            Indonesian exporter of coconut-derived products for buyers across Asia, the Middle
            East, and Europe.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-small font-medium uppercase tracking-wide text-neutral-600">
            Navigation
          </span>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-body text-neutral-900 hover:text-primary-700">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-small font-medium uppercase tracking-wide text-neutral-600">
            Contact
          </span>
          {settings?.whatsapp_number && (
            <a
              href={whatsAppLink(settings.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-neutral-900 hover:text-primary-700"
            >
              WhatsApp: {settings.whatsapp_number}
            </a>
          )}
          {settings?.contact_email && (
            <a href={`mailto:${settings.contact_email}`} className="text-body text-neutral-900 hover:text-primary-700">
              {settings.contact_email}
            </a>
          )}
          {settings?.address && <p className="text-body text-neutral-600">{settings.address}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-small font-medium uppercase tracking-wide text-neutral-600">
            Get a Quote
          </span>
          <p className="text-body text-neutral-600">
            Ready to import? Tell us what you need and our team will respond promptly.
          </p>
          <Link href="/#request-quotation" className="text-body font-medium text-primary-700 underline underline-offset-4">
            Request Quotation →
          </Link>
        </div>
      </Container>

      <div className="border-t border-neutral-200 py-6">
        <Container>
          <p className="text-small text-neutral-600">
            © {new Date().getFullYear()} {settings?.company_name ?? "CV Putri Palma Nusantara"}. All
            rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
