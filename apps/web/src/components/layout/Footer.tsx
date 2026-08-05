import type { Locale } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { getPublicSettings } from "@/lib/api";
import { whatsAppLink } from "@/lib/whatsapp";

export async function Footer({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const settings = await getPublicSettings(locale).catch(() => null);

  // Flat list for the footer column — the header's dropdown groups don't map cleanly onto
  // a single flat column, so this lists the same destinations without the grouping.
  const FOOTER_LINKS = [
    { href: "/", label: dictionary.nav.home },
    { href: "/about", label: dictionary.nav.aboutCompany },
    { href: "/products", label: dictionary.nav.ourProducts },
    { href: "/production-process", label: dictionary.nav.aboutWhatWeDo },
    { href: "/facilities", label: dictionary.nav.facilities },
    { href: "/gallery", label: dictionary.nav.gallery },
    { href: "/articles", label: dictionary.nav.news },
    { href: "/contact", label: dictionary.nav.contact },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-neutral-100">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="flex flex-col gap-3">
          <span className="text-h3 font-heading font-bold text-neutral-900">
            {settings?.company_name ?? "CV Putri Palma Nusantara"}
          </span>
          <p className="text-body text-neutral-600">{dictionary.footer.tagline}</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-small font-medium uppercase tracking-wide text-neutral-600">
            {dictionary.footer.navigationHeading}
          </span>
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="text-body text-neutral-900 hover:text-primary-700">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-small font-medium uppercase tracking-wide text-neutral-600">
            {dictionary.footer.contactHeading}
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
            {dictionary.footer.quoteHeading}
          </span>
          <p className="text-body text-neutral-600">{dictionary.footer.quoteBody}</p>
          <Link href="/#request-quotation" className="text-body font-medium text-primary-700 underline underline-offset-4">
            {dictionary.footer.quoteCta}
          </Link>
        </div>
      </Container>

      <div className="border-t border-neutral-200 py-6">
        <Container>
          <p className="text-small text-neutral-600">
            © {new Date().getFullYear()} {settings?.company_name ?? "CV Putri Palma Nusantara"}.{" "}
            {dictionary.footer.rightsReserved}
          </p>
        </Container>
      </div>
    </footer>
  );
}
