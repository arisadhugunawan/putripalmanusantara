import type { ContactSocialLink } from "@ppn/shared-types";
import {
  FacebookIcon,
  GenericLinkIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "./icons";

/** Platform → icon lookup for the open-ended social list (brief §5/§11/§12: Instagram/TikTok/
 * Facebook/LinkedIn/YouTube/WhatsApp at minimum). Falls back to a generic link icon for any
 * platform value the Admin enters that isn't one of these — never a broken/missing icon. */
const ICONS: Record<string, (props: { size?: number }) => React.ReactNode> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
};

export const CONTACT_SOCIAL_PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
] as const;

function PlatformIcon({ platform, size }: { platform: string; size?: number }) {
  const Icon = ICONS[platform.toLowerCase()] ?? GenericLinkIcon;
  return <Icon size={size} />;
}

export function hasActiveSocialLinks(links: ContactSocialLink[]): boolean {
  return links.some((l) => l.active && l.url);
}

/** Section 11-12 — micro-interaction on hover: icon scales up, background turns PPN green, a
 * subtle rotate (never a full spin), plus a native `title` tooltip. Only ever renders an icon
 * when the Admin has both set a real URL AND flipped it Active — never a fabricated handle or
 * a link to "#". Renders from the open `ContactSocialLink` CRUD list (see README) rather than
 * four fixed platform slots, so any platform the Admin adds (including ones without a
 * dedicated icon here) still shows something clickable via the generic fallback icon. */
export function SocialMediaRow({
  links,
  label,
  className,
  emptyFallback,
}: {
  links: ContactSocialLink[];
  label: string;
  className?: string;
  /** Shown instead of rendering nothing when no platform is configured yet — used by the
   * Contact Action Hub tile, which needs *something* in that slot to keep its 4-tile grid
   * intact. Omit to keep the original "render nothing" behaviour. */
  emptyFallback?: string;
}) {
  const active = links.filter((l) => l.active && l.url).sort((a, b) => a.order - b.order);

  if (active.length === 0) {
    if (!emptyFallback) return null;
    return (
      <div className={className}>
        {label && <p className="text-small font-medium uppercase tracking-wide text-neutral-600">{label}</p>}
        <p className="mt-1 text-body text-neutral-500">{emptyFallback}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <p className="text-small font-medium uppercase tracking-wide text-neutral-600">{label}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {active.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target={link.open_in_new_tab ? "_blank" : undefined}
            rel={link.open_in_new_tab ? "noopener noreferrer" : undefined}
            aria-label={link.display_name}
            title={link.display_name}
            className="group flex h-11 w-11 items-center justify-center rounded-field border border-neutral-200 text-neutral-600 transition-all duration-250 ease-out hover:-translate-y-0.5 hover:border-[#245C3A] hover:bg-[#245C3A] hover:text-white"
          >
            <span className="transition-transform duration-250 ease-out group-hover:scale-110 group-hover:rotate-6">
              <PlatformIcon platform={link.platform} size={18} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
