import type { Locale } from "@ppn/shared-types";
import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getProducts, getPublicContactPage } from "@/lib/api";
import { ContactActionCards } from "@/components/contact/ContactActionCards";
import { ContactHero } from "@/components/contact/ContactHero";
import { LocationsWithMap } from "@/components/contact/LocationsWithMap";
import { MobileContactBar } from "@/components/contact/MobileContactBar";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbJsonLd, contactPageLocalBusinessJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { buildWhatsAppMessage, buildWhatsAppProductMessage } from "@/lib/whatsapp";

const LOCATIONS_ANCHOR_ID = "locations";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const t = dictionary.contact;
  return buildPageMetadata({
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/contact",
    locale,
  });
}

/**
 * Premium B2B Contact page — full UI/UX revamp (redesign brief): deep-green hero, a 4-tile
 * Contact Action Hub (WhatsApp/Email/Location/Social), and an interactive location switcher
 * wired to the main Google Map — all Admin-editable via the Contact Page CMS (Draft/Publish —
 * see README "Contact Page — Full Redesign"). Deliberately has NO inquiry form — every
 * conversion path here is a direct click-to-act link (mailto/WhatsApp/Maps/social), never a
 * form submission. The Hero's badges/CTA buttons and the Buyer/Supplier CTA sections were
 * removed on user request to declutter the page — WhatsApp/Email/Location stay reachable via
 * the Action Hub, the sticky mobile bar, and the floating WhatsApp button.
 */
export default async function ContactPage({
  params,
  searchParams,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const { product: productSlug } = await searchParams;
  const [contactPage, products, dictionary] = await Promise.all([
    getPublicContactPage(locale).catch(() => null),
    getProducts(locale).catch(() => []),
    getDictionary(locale as Locale),
  ]);
  const t = dictionary.contact;

  // A Contact page that hasn't been published yet (or was explicitly Unpublished) has no real
  // data to show — rather than crash or render fabricated placeholders, this honestly shows
  // nothing beyond the shell, exactly like every other "not yet configured" gap in this
  // project. In practice this only happens transiently: real PPN contact data is seeded and
  // published as part of this feature's rollout (see README).
  if (!contactPage) {
    return (
      <main>
        <Container className="py-24 text-center">
          <p className="text-body text-neutral-500">This page is being updated. Please check back shortly.</p>
        </Container>
      </main>
    );
  }

  const { settings, locations, social_links: socialLinks, main_map_location: mainMapLocation } = contactPage;

  // WhatsApp message: defaults to the general product-listing message (built from the Admin's
  // Greeting/Message/Product list label/Closing fields, see Contact Page CMS), but switches to
  // the per-product variant when this page was reached from a specific Product page
  // (?product= slug) — the product name interpolated is the real, already-localized
  // `product.name`, never a hardcoded string.
  const matchedProduct =
    typeof productSlug === "string" ? products.find((p) => p.slug === productSlug) : undefined;
  const whatsappMessage = matchedProduct
    ? buildWhatsAppProductMessage(settings, matchedProduct.name, t.whatsappProductMessageTemplate)
    : buildWhatsAppMessage(settings, products.map((p) => p.name));

  const weekdayShort = {
    mon: t.weekdayShortMon,
    tue: t.weekdayShortTue,
    wed: t.weekdayShortWed,
    thu: t.weekdayShortThu,
    fri: t.weekdayShortFri,
    sat: t.weekdayShortSat,
    sun: t.weekdayShortSun,
  };

  return (
    <main className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0">
      <JsonLd data={contactPageLocalBusinessJsonLd(settings, mainMapLocation, locale)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: dictionary.nav.home, path: "/" },
            { name: dictionary.nav.contact, path: "/contact" },
          ],
          locale,
        )}
      />

      <ContactHero settings={settings} navHomeLabel={dictionary.nav.home} navContactLabel={dictionary.nav.contact} />

      <Section className="bg-white">
        <Container>
          <FadeUpSection>
            <h2 className="text-center text-h2 text-neutral-900">{t.sectionGetInTouch}</h2>
            <div className="mt-10">
              <ContactActionCards
                settings={settings}
                socialLinks={socialLinks}
                whatsappMessage={whatsappMessage}
                locationsAnchorId={LOCATIONS_ANCHOR_ID}
                socialLabel={t.socialMediaLabel}
                labels={{
                  emailLabel: t.emailLabel,
                  whatsappLabel: t.whatsappLabel,
                  businessHoursLabel: t.businessHoursLabel,
                  weekdayShort,
                  openNowLabel: t.openNowLabel,
                  closedNowLabel: t.closedNowLabel,
                  closedLabel: t.closedLabel,
                  locationLabel: t.locationLabel,
                }}
              />
            </div>
          </FadeUpSection>
        </Container>
      </Section>

      <Section id={LOCATIONS_ANCHOR_ID} className="scroll-mt-24 bg-[#F7F8F3]">
        <Container>
          <FadeUpSection>
            <LocationsWithMap
              locations={locations}
              initialLocationId={mainMapLocation?.id ?? null}
              heading={t.sectionOurLocation}
              subtitle={t.sectionOurLocationSubtitle}
              openInGoogleMapsLabel={t.openInGoogleMaps}
              viewLocationLabel={t.viewLocation}
            />
          </FadeUpSection>
        </Container>
      </Section>

      <MobileContactBar
        settings={settings}
        whatsappMessage={whatsappMessage}
        locationsAnchorId={LOCATIONS_ANCHOR_ID}
        labels={{ whatsappLabel: t.whatsappLabel, emailLabel: t.emailLabel, locationLabel: t.locationLabel }}
      />
    </main>
  );
}
