import type { PublicSiteSettings } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { whatsAppLink } from "@/lib/whatsapp";

const SOCIAL_LINKS = [
  { key: "social_facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "social_instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "social_linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "social_tiktok", label: "TikTok", Icon: TikTokIcon },
] as const;

/** Company info + contact cards + social row — real Settings data only; a field/icon is
 * simply omitted when the client hasn't provided it (no "+62 xxx xxx xxxx" placeholders,
 * no social icons linking to "#"). */
export function ContactCompanyPanel({ settings }: { settings: PublicSiteSettings | null }) {
  const activeSocialLinks = SOCIAL_LINKS.map((item) => ({ ...item, url: settings?.[item.key] })).filter(
    (item): item is (typeof SOCIAL_LINKS)[number] & { url: string } => Boolean(item.url),
  );

  return (
    <div>
      <span className="font-heading text-h2 font-bold text-neutral-900">PPN</span>
      <p className="mt-2 text-body-lg font-medium text-neutral-900">
        {settings?.company_name ?? "CV Putri Palma Nusantara"}
      </p>
      <p className="mt-3 max-w-md text-body text-neutral-600">
        We are an Indonesian exporter specializing in coconut-derived products — Semi Husked
        Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — for buyers across Asia,
        the Middle East, and Europe.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {settings?.contact_email && (
          <ContactCard Icon={MailIcon} label="Email" href={`mailto:${settings.contact_email}`}>
            {settings.contact_email}
          </ContactCard>
        )}
        {settings?.contact_phone && (
          <ContactCard Icon={PhoneIcon} label="Phone" href={`tel:${settings.contact_phone}`}>
            {settings.contact_phone}
          </ContactCard>
        )}
        {settings?.address && (
          <ContactCard Icon={PinIcon} label="Address">
            {settings.address}
          </ContactCard>
        )}
        {settings?.operating_hours && (
          <ContactCard Icon={ClockIcon} label="Business Hours">
            {settings.operating_hours}
          </ContactCard>
        )}
      </div>

      {(activeSocialLinks.length > 0 || settings?.whatsapp_number) && (
        <div className="mt-6">
          <p className="text-small font-medium uppercase tracking-wide text-neutral-600">Social Media</p>
          <div className="mt-3 flex items-center gap-2">
            {activeSocialLinks.map(({ key, label, Icon, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-field border border-neutral-200 text-neutral-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500 hover:text-primary-700"
              >
                <Icon />
              </a>
            ))}
            {settings?.whatsapp_number && (
              <a
                href={whatsAppLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-field border border-neutral-200 text-neutral-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500 hover:text-primary-700"
              >
                <WhatsAppIcon />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ContactCard({
  Icon,
  label,
  href,
  children,
}: {
  Icon: () => React.ReactNode;
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <Card hoverable className="flex h-full items-start gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-primary-50 text-primary-700">
        <Icon />
      </span>
      <span>
        <span className="block text-small font-medium uppercase tracking-wide text-neutral-500">{label}</span>
        <span className="mt-0.5 block text-body text-neutral-900">{children}</span>
      </span>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4.5 6.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M4.5 4h3.2l1.3 4.5-2 1.6a12.5 12.5 0 0 0 5.9 5.9l1.6-2 4.5 1.3v3.2c0 1-.8 1.6-1.7 1.5A16.5 16.5 0 0 1 4 5.7c-.1-.9.5-1.7 1.5-1.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
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
