import type { Locale } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { getProducts, getPublicSettings } from "@/lib/api";
import { whatsAppLink } from "@/lib/whatsapp";

const SOCIAL_LINKS = [
  { key: "social_facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "social_instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "social_linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "social_tiktok", label: "TikTok", Icon: TikTokIcon },
] as const;

export async function Footer({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const [settings, products] = await Promise.all([
    getPublicSettings(locale).catch(() => null),
    getProducts(locale).catch(() => []),
  ]);

  const companyLinks = [
    { href: "/about#company", label: dictionary.nav.aboutCompanyProfile },
    { href: "/about#team", label: dictionary.nav.aboutTeam },
    { href: "/about#legal", label: dictionary.nav.aboutLegalCertificate },
    { href: "/about#factory", label: dictionary.nav.aboutFactory },
    { href: "/gallery", label: dictionary.nav.gallery },
  ];

  const quickLinks = [
    { href: "/facilities#production-process", label: dictionary.nav.facilitiesProductionProcess },
    { href: "/facilities#shipment-terms", label: dictionary.nav.facilitiesShipmentTerms },
    { href: "/facilities#moq-payment", label: dictionary.nav.facilitiesMoqPayment },
    { href: "/facilities#packaging-options", label: dictionary.nav.facilitiesPackagingOptions },
    { href: "/facilities#faq", label: dictionary.nav.facilitiesFaq },
    { href: "/articles", label: dictionary.nav.news },
  ];

  const activeSocialLinks = SOCIAL_LINKS.map((item) => ({ ...item, url: settings?.[item.key] })).filter(
    (item): item is (typeof SOCIAL_LINKS)[number] & { url: string } => Boolean(item.url),
  );

  return (
    <footer className="bg-neutral-900 text-neutral-50">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:py-20">
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <span className="font-heading text-h2 font-bold text-white">PPN</span>
          <p className="text-body text-neutral-300">{dictionary.footer.tagline}</p>
          {activeSocialLinks.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {activeSocialLinks.map(({ key, label, Icon, url }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-field border border-primary-500 text-primary-500 transition-colors hover:bg-primary-500 hover:text-neutral-900"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>

        <FooterColumn heading={dictionary.footer.companyHeading}>
          {companyLinks.map((item) => (
            <Link key={item.href} href={item.href} className="text-body text-neutral-300 transition-colors hover:text-primary-500">
              {item.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn heading={dictionary.footer.productsHeading}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="text-body text-neutral-300 transition-colors hover:text-primary-500"
            >
              {product.name}
            </Link>
          ))}
          <Link href="/products" className="text-body text-neutral-300 transition-colors hover:text-primary-500">
            {dictionary.nav.ourProducts}
          </Link>
        </FooterColumn>

        <FooterColumn heading={dictionary.footer.quickLinkHeading}>
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="text-body text-neutral-300 transition-colors hover:text-primary-500">
              {item.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn heading={dictionary.footer.contactHeading}>
          {settings?.address && (
            <p className="flex items-start gap-2.5 text-body text-neutral-300">
              <PinIcon />
              <span>{settings.address}</span>
            </p>
          )}
          {settings?.contact_phone && (
            <a
              href={`tel:${settings.contact_phone}`}
              className="flex items-center gap-2.5 text-body text-neutral-300 transition-colors hover:text-primary-500"
            >
              <PhoneIcon />
              {settings.contact_phone}
            </a>
          )}
          {settings?.whatsapp_number && (
            <a
              href={whatsAppLink(settings.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-body text-neutral-300 transition-colors hover:text-primary-500"
            >
              <WhatsAppIcon />
              {settings.whatsapp_number}
            </a>
          )}
          {settings?.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center gap-2.5 text-body text-neutral-300 transition-colors hover:text-primary-500"
            >
              <MailIcon />
              {settings.contact_email}
            </a>
          )}
        </FooterColumn>
      </Container>

      <div className="bg-primary-700 py-5">
        <Container>
          <p className="text-center text-small text-white">
            © {new Date().getFullYear()} {settings?.company_name ?? "CV Putri Palma Nusantara"}.{" "}
            {dictionary.footer.rightsReserved}
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="w-fit border-b-2 border-primary-500 pb-2 font-heading text-body-lg font-bold text-primary-500">
        {heading}
      </span>
      {children}
    </div>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-primary-500">
      <path
        d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className="shrink-0 text-primary-500">
      <path
        d="M4.5 4h3.2l1.3 4.5-2 1.6a12.5 12.5 0 0 0 5.9 5.9l1.6-2 4.5 1.3v3.2c0 1-.8 1.6-1.7 1.5A16.5 16.5 0 0 1 4 5.7c-.1-.9.5-1.7 1.5-1.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className="shrink-0 text-primary-500">
      <path
        d="M12 3a9 9 0 0 0-7.8 13.4L3 21l4.7-1.2A9 9 0 1 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 8.4c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .5.4.2.4.6 1.4.6 1.5.1.1.1.3 0 .4a2 2 0 0 1-.3.4l-.4.4c-.1.1-.2.3-.1.5.2.3.7 1.1 1.5 1.7.9.7 1.6 1 1.9 1.1.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.4.7c.2.1.3.1.4.3.1.1.1.6-.1 1.2-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.9-2.8-1.2-4.5-4-4.7-4.2-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className="shrink-0 text-primary-500">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4.5 6.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M14 8.5h2V5.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3v2.3H7v3.2h2.4V21h3.3v-5.7h2.4l.4-3.2h-2.8V10c0-.9.3-1.5 1.3-1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.8 10v6.5M7.8 7.6v.1M11.5 16.5V13c0-1.4.8-2.3 2-2.3s1.8.9 1.8 2.3v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M14.5 3.5c.4 2 1.8 3.4 3.8 3.6v2.6a6.6 6.6 0 0 1-3.8-1.2v5.9a4.7 4.7 0 1 1-4.7-4.7c.2 0 .5 0 .7.1v2.7a2 2 0 1 0 1.4 1.9V3.5h2.6Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
