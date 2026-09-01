import type { ContactLocation, Locale, PublicSiteBranding } from "@ppn/shared-types";
import { Container, buttonVariants, cn } from "@ppn/ui-components";
import Image from "next/image";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { getFooterSettings, getProducts, getPublicContactPage } from "@/lib/api";
import { DEFAULT_ABOUT_NAV_STATE, type AboutNavState } from "@/lib/nav-config";
import { sanitizeExternalUrl } from "@/lib/url";
import { buildWhatsAppMessage, whatsAppLink } from "@/lib/whatsapp";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  PinIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/contact/icons";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { BrandLogoImage } from "./BrandLogoImage";

const PalmLeaf = DECORATIVE_SVGS.palm_leaf;
const LeafOutline = DECORATIVE_SVGS.leaf_outline;

const SOCIAL_ICON: Record<string, (props: { size?: number }) => React.ReactNode> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
};

const OVERLAY_COLOR: Record<string, string> = {
  dark_green: "#0F2A1C",
  charcoal: "#1C1C1C",
  black: "#000000",
  green_gradient: "#0F2A1C",
};

const OBJECT_POSITION_CLASS: Record<string, string> = {
  center: "object-center",
  center_top: "object-top",
  center_bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

const WEEKDAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Collapses e.g. ["mon".."sat"] into "Mon–Sat" — same algorithm as
 * `BusinessHoursStatus.tsx`, inlined here since the Footer doesn't need that component's live
 * open/closed ticking state, just a static readable range. `weekdayShort` reuses the same
 * translated abbreviations the Contact page already shows (`dictionary.contact.weekdayShort*`)
 * so the two surfaces can never drift into different languages for the same days. */
function formatDayRange(days: string[], weekdayShort: Record<string, string>): string {
  const set = new Set(days);
  const ranges: string[] = [];
  let i = 0;
  while (i < WEEKDAY_ORDER.length) {
    if (!set.has(WEEKDAY_ORDER[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < WEEKDAY_ORDER.length && set.has(WEEKDAY_ORDER[j + 1])) j++;
    ranges.push(i === j ? weekdayShort[WEEKDAY_ORDER[i]] : `${weekdayShort[WEEKDAY_ORDER[i]]}–${weekdayShort[WEEKDAY_ORDER[j]]}`);
    i = j + 1;
  }
  return ranges.join(", ");
}

/**
 * Premium, CMS-driven footer — background photo/overlay, brand-area copy, and CTA card come
 * from `FooterSettings` (Admin → Settings → Footer Management). Contact info (email/WhatsApp/
 * business hours), office locations, and social media links are deliberately NOT duplicated
 * into that model — they're read straight from the same published Contact Page payload the
 * `/contact` page itself renders (`getPublicContactPage()`), so there is exactly one place to
 * edit them and the two surfaces can never drift apart. Company/Products/Resources navigation
 * columns link to real, working routes (same convention as the Header's own nav) — not yet a
 * separate admin-managed link CRUD, since the Header's main nav isn't either and building CMS
 * link management for only one of the two would be an inconsistent admin experience.
 */
export async function Footer({
  dictionary,
  locale,
  branding,
  aboutNav = DEFAULT_ABOUT_NAV_STATE,
}: {
  dictionary: Dictionary;
  locale: Locale;
  branding: PublicSiteBranding;
  /** Published About Company visibility — see `AboutNavState`. */
  aboutNav?: AboutNavState;
}) {
  const [footerSettings, contactPage, products] = await Promise.all([
    getFooterSettings(locale).catch(() => null),
    getPublicContactPage().catch(() => null),
    getProducts(locale).catch(() => []),
  ]);

  if (footerSettings && !footerSettings.enabled) {
    return null;
  }

  // Same visibility rule as the Header: an About link is only offered while that page — and
  // that specific section — is actually published.
  const aboutLinks = aboutNav.pageVisible
    ? (
        [
          { key: "company", href: "/about#company", label: dictionary.nav.aboutCompanyProfile },
          { key: "team", href: "/about#team", label: dictionary.nav.aboutTeam },
          { key: "legal_certificate", href: "/about#legal", label: dictionary.nav.aboutLegalCertificate },
          { key: "factory", href: "/about#factory", label: dictionary.nav.aboutFactory },
        ] as const
      ).filter((link) => aboutNav.visibleSections.includes(link.key))
    : [];

  const companyLinks = [
    ...aboutLinks.map(({ href, label }) => ({ href, label })),
    { href: "/gallery", label: dictionary.nav.gallery },
  ];

  const quickLinks = [
    { href: "/production-process", label: dictionary.nav.facilitiesProductionProcess },
    { href: "/facilities#shipment-terms", label: dictionary.nav.facilitiesShipmentTerms },
    { href: "/facilities#moq-payment", label: dictionary.nav.facilitiesMoqPayment },
    { href: "/facilities#faq", label: dictionary.nav.facilitiesFaq },
    { href: "/articles", label: dictionary.nav.news },
  ];

  const activeSocialLinks = (contactPage?.social_links ?? [])
    .filter((s) => s.active && SOCIAL_ICON[s.platform])
    .map((s) => ({ ...s, sanitizedUrl: sanitizeExternalUrl(s.url) }))
    .filter((s): s is typeof s & { sanitizedUrl: string } => s.sanitizedUrl !== null)
    .sort((a, b) => a.order - b.order);

  const settings = contactPage?.settings ?? null;
  const locations = contactPage?.locations.filter((l) => l.active) ?? [];
  const weekdayShort: Record<string, string> = {
    mon: dictionary.contact.weekdayShortMon,
    tue: dictionary.contact.weekdayShortTue,
    wed: dictionary.contact.weekdayShortWed,
    thu: dictionary.contact.weekdayShortThu,
    fri: dictionary.contact.weekdayShortFri,
    sat: dictionary.contact.weekdayShortSat,
    sun: dictionary.contact.weekdayShortSun,
  };
  const businessHoursLabel = settings
    ? `${formatDayRange(settings.business_hours_open_days, weekdayShort)} · ${settings.business_hours_open_time}–${settings.business_hours_close_time} (GMT${settings.business_hours_utc_offset >= 0 ? "+" : ""}${settings.business_hours_utc_offset})`
    : null;
  const whatsAppMessage = settings ? buildWhatsAppMessage(settings, products.map((p) => p.name)) : "";

  const showCta = (footerSettings?.show_cta ?? true) && !!footerSettings?.cta_headline;
  const showSocial = (footerSettings?.show_social ?? true) && activeSocialLinks.length > 0;
  const showContact = footerSettings?.show_contact ?? true;
  const showNavigation = footerSettings?.show_navigation ?? true;

  const backgroundImage = footerSettings?.background_image ?? null;
  const mobileBackgroundImage = footerSettings?.mobile_background_image ?? backgroundImage;
  const overlayOpacity = (footerSettings?.overlay_opacity ?? 70) / 100;
  const overlayType = footerSettings?.overlay_type ?? "dark_green";
  const bgPosition = footerSettings?.background_position ?? "center";
  const mobileBgPosition = footerSettings?.mobile_background_position ?? "center";
  const altText = footerSettings?.background_alt_text?.trim() || footerSettings?.company_name || "PPN";

  return (
    <footer className="relative overflow-hidden bg-(--color-footer) text-neutral-50">
      {backgroundImage ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ animation: "footer-bg-zoom 10s ease-out forwards" }}>
            <Image
              src={backgroundImage.file_url}
              alt={altText}
              fill
              sizes="100vw"
              className={cn("hidden object-cover sm:block", OBJECT_POSITION_CLASS[bgPosition])}
            />
            <Image
              src={mobileBackgroundImage?.file_url ?? backgroundImage.file_url}
              alt={altText}
              fill
              sizes="100vw"
              className={cn("block object-cover sm:hidden", OBJECT_POSITION_CLASS[mobileBgPosition])}
            />
          </div>
          {overlayType === "green_gradient" ? (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, rgba(15,42,28,${overlayOpacity}) 0%, rgba(15,42,28,${overlayOpacity * 0.55}) 45%, rgba(15,42,28,${overlayOpacity}) 100%)`,
              }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: OVERLAY_COLOR[overlayType], opacity: overlayOpacity }}
            />
          )}
        </div>
      ) : (
        <PalmLeaf
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-10 h-72 w-72 text-primary-500/[0.06] sm:h-96 sm:w-96"
        />
      )}
      <LeafOutline
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 text-primary-300/[0.07]"
      />

      {showCta && footerSettings && (
        <FadeUpSection className="relative border-b border-white/10">
          <Container className="flex flex-col items-start gap-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
            <div className="max-w-xl">
              <h2 className="font-heading text-h3 font-bold text-white">{footerSettings.cta_headline}</h2>
              {footerSettings.cta_description && (
                <p className="mt-2 text-body text-neutral-300">{footerSettings.cta_description}</p>
              )}
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              {settings?.whatsapp_number && (
                <a
                  href={whatsAppLink(settings.whatsapp_number, whatsAppMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants("primary", "lg")}
                >
                  {footerSettings.cta_secondary_text}
                </a>
              )}
              <Link
                href="/products"
                className={cn(
                  buttonVariants(settings?.whatsapp_number ? "secondary" : "primary", "lg"),
                  settings?.whatsapp_number && "border-white/40 text-white hover:border-white hover:bg-white/10 hover:text-white",
                )}
              >
                {footerSettings.cta_primary_text}
              </Link>
            </div>
          </Container>
        </FadeUpSection>
      )}

      <Container className="relative grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:py-20">
        <FadeUpSection className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1" style={{ transitionDelay: "60ms" }}>
          <Link href="/" className="flex w-fit items-center">
            {branding.footer_logo ? (
              <BrandLogoImage
                media={branding.footer_logo}
                altText={branding.footer_logo_alt}
                className="h-12 w-[210px]"
                fallbackClassName="text-white"
              />
            ) : (
              <span className="font-heading text-h2 font-bold text-white">PPN</span>
            )}
          </Link>
          {footerSettings?.tagline && <p className="text-body-lg font-medium text-white">{footerSettings.tagline}</p>}
          <p className="text-body text-neutral-300">
            {footerSettings?.description ?? dictionary.footer.tagline}
          </p>
          {showSocial && (
            <div className="mt-2 flex items-center gap-2">
              {activeSocialLinks.map((social) => {
                const Icon = SOCIAL_ICON[social.platform];
                return (
                  <a
                    key={social.id}
                    href={social.sanitizedUrl}
                    target={social.open_in_new_tab ? "_blank" : undefined}
                    rel={social.open_in_new_tab ? "noopener noreferrer" : undefined}
                    aria-label={`${dictionary.footer.openSocialLinkPrefix} ${social.display_name || social.platform}`}
                    title={social.display_name || social.platform}
                    className="flex h-11 w-11 items-center justify-center rounded-field border border-primary-500 text-primary-500 transition-all hover:scale-[1.08] hover:bg-primary-500 hover:text-neutral-900 hover:shadow-[0_0_16px_rgba(147,196,63,0.5)]"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          )}
        </FadeUpSection>

        {showNavigation && (
          <>
            <FadeUpSection style={{ transitionDelay: "120ms" }}>
              <FooterColumn heading={dictionary.footer.companyHeading}>
                {companyLinks.map((item) => (
                  <FooterLink key={item.href} href={item.href}>
                    {item.label}
                  </FooterLink>
                ))}
              </FooterColumn>
            </FadeUpSection>

            <FadeUpSection style={{ transitionDelay: "180ms" }}>
              <FooterColumn heading={dictionary.footer.productsHeading}>
                {products.map((product) => (
                  <FooterLink key={product.id} href={`/products/${product.slug}`}>
                    {product.name}
                  </FooterLink>
                ))}
                <FooterLink href="/products">{dictionary.nav.ourProducts}</FooterLink>
              </FooterColumn>
            </FadeUpSection>

            <FadeUpSection style={{ transitionDelay: "240ms" }}>
              <FooterColumn heading={dictionary.footer.quickLinkHeading}>
                {quickLinks.map((item) => (
                  <FooterLink key={item.href} href={item.href}>
                    {item.label}
                  </FooterLink>
                ))}
                <FooterLink href="/gallery">{dictionary.nav.gallery}</FooterLink>
              </FooterColumn>
            </FadeUpSection>
          </>
        )}

        {showContact && (
          <FadeUpSection style={{ transitionDelay: "300ms" }}>
            <FooterColumn heading={dictionary.footer.contactHeading}>
              {locations.map((location) => (
                <FooterLocationBlock key={location.id} location={location} dictionary={dictionary} />
              ))}
              {settings?.whatsapp_number && (
                <a
                  href={whatsAppLink(settings.whatsapp_number, whatsAppMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-body text-neutral-300 transition-colors hover:text-primary-500"
                >
                  <WhatsAppIcon />
                  {settings.whatsapp_number}
                </a>
              )}
              {settings?.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-2.5 text-body text-neutral-300 transition-colors hover:text-primary-500"
                >
                  <MailIcon />
                  {settings.email}
                </a>
              )}
              {businessHoursLabel && (
                <p className="flex items-start gap-2.5 text-body text-neutral-300">
                  <span className="mt-0.5 shrink-0 text-primary-500">
                    <ClockIcon />
                  </span>
                  <span>{businessHoursLabel}</span>
                </p>
              )}
            </FooterColumn>
          </FadeUpSection>
        )}
      </Container>

      {/* pb-28 on mobile only — some pages (e.g. Contact) render a `fixed inset-x-0 bottom-0
          sm:hidden` mobile contact bar (see MobileContactBar.tsx) that would otherwise sit on
          top of this bar; that component's own convention is reserving space rather than
          fighting z-index, applied here since the Footer has no way to know whether the
          current page has that bar. sm:hidden kicks in at the exact same breakpoint
          MobileContactBar itself hides at, so desktop/tablet padding is untouched. */}
      <div className="relative bg-primary-700 pb-28 pt-5 sm:py-5">
        <Container className="flex items-center justify-center">
          <p className="text-center text-small text-white">
            © {new Date().getFullYear()} {footerSettings?.company_name ?? "CV Putri Palma Nusantara"}.{" "}
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

/** Hover: text → PPN green, small arrow slides right — brief's "Products →" / "Products →→"
 * micro-interaction, kept subtle (arrow translate only, no bounce/scale). */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1 text-body text-neutral-300 transition-colors hover:text-primary-500"
    >
      {children}
      <span aria-hidden="true" className="translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}

function FooterLocationBlock({ location, dictionary }: { location: ContactLocation; dictionary: Dictionary }) {
  const mapsUrl = sanitizeExternalUrl(location.google_maps_url);
  return (
    <div className="flex items-center gap-2.5 text-body text-neutral-300">
      <span className="shrink-0 text-primary-500">
        <PinIcon />
      </span>
      <span>
        <span className="font-medium text-neutral-100">{location.name}</span>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-small font-medium text-primary-500 underline underline-offset-2 hover:text-primary-400"
          >
            {dictionary.contact.openInGoogleMaps} →
          </a>
        )}
      </span>
    </div>
  );
}
