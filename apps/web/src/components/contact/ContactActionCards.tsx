import type { ContactPageSettings, ContactSocialLink } from "@ppn/shared-types";
import { whatsAppLink } from "@/lib/whatsapp";
import { BusinessHoursStatus } from "./BusinessHoursStatus";
import { SocialMediaRow } from "./SocialMediaRow";
import { MailIcon, PinIcon, ShareIcon, WhatsAppIcon } from "./icons";

interface HubLabels {
  emailLabel: string;
  whatsappLabel: string;
  businessHoursLabel: string;
  weekdayShort: Record<string, string>;
  openNowLabel: string;
  closedNowLabel: string;
  closedLabel: string;
  locationLabel: string;
}

/**
 * "CONTACT PPN" Action Hub (redesign brief §7) — four interactive tiles (WhatsApp/Email/
 * Location/Social), each behaving like a real tile rather than a plain card: icon nudges,
 * an arrow slides in, the tile lifts 2-4px, and a soft green glow appears on hover — all pure
 * CSS transform/opacity/box-shadow, no JS animation loop. Business Hours status is folded
 * into the WhatsApp tile (brief §10 pairs "Talk to Our Export Team" with live open/closed
 * status) rather than a separate fifth tile, keeping the hub at the four tiles the brief lists.
 */
export function ContactActionCards({
  settings,
  socialLinks,
  whatsappMessage,
  locationsAnchorId,
  socialLabel,
  labels,
}: {
  settings: ContactPageSettings;
  socialLinks: ContactSocialLink[];
  whatsappMessage: string;
  locationsAnchorId: string;
  socialLabel: string;
  labels: HubLabels;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {settings.whatsapp_number && (
        <Tile
          href={whatsAppLink(settings.whatsapp_number, whatsappMessage)}
          external
          ariaLabel={`${labels.whatsappLabel}: +${formatWhatsAppDisplay(settings.whatsapp_number)}`}
        >
          <TileIcon>
            <WhatsAppIcon size={22} />
          </TileIcon>
          <TileLabel>{labels.whatsappLabel}</TileLabel>
          <p className="mt-1 text-body-lg font-medium text-neutral-900">+{formatWhatsAppDisplay(settings.whatsapp_number)}</p>
          <BusinessHoursStatus settings={settings} labels={labels} className="mt-3" compact />
          <TileArrow />
        </Tile>
      )}

      {settings.email && (
        <Tile href={`mailto:${settings.email}`} ariaLabel={`${labels.emailLabel}: ${settings.email}`}>
          <TileIcon>
            <MailIcon size={22} />
          </TileIcon>
          <TileLabel>{labels.emailLabel}</TileLabel>
          <p className="mt-1 text-body-lg font-medium break-words text-neutral-900">{settings.email}</p>
          <TileArrow />
        </Tile>
      )}

      <Tile href={`#${locationsAnchorId}`} ariaLabel={labels.locationLabel}>
        <TileIcon>
          <PinIcon size={22} />
        </TileIcon>
        <TileLabel>{labels.locationLabel}</TileLabel>
        <p className="mt-1 text-body-lg font-medium text-neutral-900">Tolitoli · Palu · Surabaya</p>
        <TileArrow />
      </Tile>

      <div className="group relative flex h-full flex-col rounded-card border border-neutral-200 bg-white p-6 shadow-card">
        <TileIcon>
          <ShareIcon size={22} />
        </TileIcon>
        <TileLabel>{socialLabel}</TileLabel>
        <SocialMediaRow links={socialLinks} label="" className="mt-2" emptyFallback="Coming soon" />
      </div>
    </div>
  );
}

function Tile({
  href,
  external,
  ariaLabel,
  children,
}: {
  href: string;
  external?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-neutral-200 bg-white p-6 shadow-card transition-all duration-250 ease-out hover:-translate-y-1 hover:border-[#6FAF3A]/40 hover:shadow-[0_16px_36px_-14px_rgba(24,61,43,0.28)]"
    >
      {children}
    </a>
  );
}

function TileIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-field border border-[#6FAF3A]/20 bg-[#EEF5E8] text-[#245C3A] transition-all duration-250 ease-out group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:border-[#245C3A] group-hover:bg-[#245C3A] group-hover:text-white lg:h-16 lg:w-16">
      {children}
    </span>
  );
}

function TileLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-small font-medium tracking-wide text-neutral-500 uppercase">{children}</p>;
}

function TileArrow() {
  return (
    <span
      aria-hidden="true"
      className="mt-auto flex translate-x-0 items-center gap-1 pt-4 text-small font-medium text-[#245C3A] opacity-0 transition-all duration-250 ease-out group-hover:translate-x-1 group-hover:opacity-100"
    >
      →
    </span>
  );
}

/** Displays as "+62 822 9380 7717" from a stored "6282293807717"/"+6282293807717" — grouped
 * for readability, never altering the digits themselves. */
function formatWhatsAppDisplay(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9), digits.slice(9)].filter(Boolean);
  return groups.join(" ");
}
