import type { PublicSiteSettings } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { whatsAppLink } from "@/lib/whatsapp";

/** Three quick-contact CTAs. The Catalogue card only renders once the client has uploaded a
 * real PDF and added its URL via Admin > Pengaturan (`company_catalogue_url`) — no dead
 * download link in the meantime. */
interface QuickContactCard {
  key: string;
  href: string;
  external: boolean;
  Icon: () => React.ReactNode;
  title: string;
  description: string;
}

export function QuickContactCards({ settings }: { settings: PublicSiteSettings | null }) {
  const cards: QuickContactCard[] = [];

  if (settings?.whatsapp_number) {
    cards.push({
      key: "whatsapp",
      href: whatsAppLink(settings.whatsapp_number, "Hi, I'd like to speak with your export sales team."),
      external: true,
      Icon: WhatsAppIcon,
      title: "Chat with Export Sales",
      description: "Get a fast reply from our team directly on WhatsApp.",
    });
  }
  if (settings?.contact_email) {
    cards.push({
      key: "email",
      href: `mailto:${settings.contact_email}`,
      external: false,
      Icon: MailIcon,
      title: "Send an Email",
      description: `Prefer email? Reach us anytime at ${settings.contact_email}.`,
    });
  }
  if (settings?.company_catalogue_url) {
    cards.push({
      key: "catalogue",
      href: settings.company_catalogue_url,
      external: true,
      Icon: DownloadIcon,
      title: "Download Company Catalogue",
      description: "Get our full product and export capability overview as a PDF.",
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cards.map(({ key, href, external, Icon, title, description }) => (
        <a key={key} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          <Card hoverable className="h-full">
            <span className="flex h-12 w-12 items-center justify-center rounded-field bg-primary-50 text-primary-700">
              <Icon />
            </span>
            <p className="mt-4 text-body-lg font-medium text-neutral-900">{title}</p>
            <p className="mt-1.5 text-body text-neutral-600">{description}</p>
          </Card>
        </a>
      ))}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4.5 6.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M12 4v11m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
