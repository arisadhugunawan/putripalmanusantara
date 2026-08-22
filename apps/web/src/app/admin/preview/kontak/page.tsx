"use client";

import type { ContactLocation, ContactPageSettings, ContactSocialLink, ProductSummary } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { ContactActionCards } from "@/components/contact/ContactActionCards";
import { ContactHero } from "@/components/contact/ContactHero";
import { LocationsWithMap } from "@/components/contact/LocationsWithMap";
import { buildWhatsAppMessage } from "@/lib/whatsapp";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Public GET, no auth needed — mirrors `admin/preview/about-company/page.tsx`'s `publicGet`. */
async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  const json = (await res.json()) as { data: T };
  return json.data;
}

const LABELS = {
  emailLabel: "Email",
  whatsappLabel: "WhatsApp",
  businessHoursLabel: "Business Hours",
  openNowLabel: "Open now",
  closedNowLabel: "Closed now",
  closedLabel: "Closed",
  locationLabel: "Location",
  weekdayShort: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
};

interface PreviewData {
  settings: ContactPageSettings;
  locations: ContactLocation[];
  socialLinks: ContactSocialLink[];
  products: ProductSummary[];
}

const LOCATIONS_ANCHOR_ID = "locations";

/**
 * Draft preview — always renders the *current unpublished* Admin state, same "read admin
 * endpoints directly, re-apply the same active/order filter Publish would apply" approach as
 * `admin/preview/about-company/page.tsx`. Never affects the public site: read-only, and reads
 * the live draft tables rather than the frozen `ContactPagePublishedSnapshot`.
 */
export default function ContactPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [settings, locations, socialLinks, products] = await Promise.all([
          adminApi.get<ContactPageSettings>("/admin/contact-page/settings"),
          adminApi.get<ContactLocation[]>("/admin/contact-page/locations"),
          adminApi.get<ContactSocialLink[]>("/admin/contact-page/social-links"),
          publicGet<ProductSummary[]>("/products"),
        ]);
        setData({
          settings,
          locations: locations.filter((l) => l.active).sort((a, b) => a.order - b.order),
          socialLinks: socialLinks.filter((l) => l.active).sort((a, b) => a.order - b.order),
          products,
        });
      } catch {
        setError(true);
      }
    }
    void load();
  }, []);

  const mainMapLocation = data
    ? (data.locations.find((l) => l.id === data.settings.main_map_location_id) ?? data.locations[0] ?? null)
    : null;

  const whatsappMessage = data
    ? buildWhatsAppMessage(data.settings, data.products.map((p) => p.name))
    : "";

  return (
    <div>
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-100 px-4 py-2 text-small text-amber-900">
        <span>
          <strong>Draft Preview</strong> — shows your unpublished changes. Site visitors do not see this.
        </span>
        <Link href="/admin/pengaturan/kontak" className="font-medium underline">
          ← Back to Contact Page
        </Link>
      </div>

      {error && <p className="p-8 text-center text-body text-red-600">Failed to load preview. Please try again.</p>}
      {!error && !data && <p className="p-8 text-center text-body text-neutral-500">Loading preview...</p>}

      {data && (
        <main>
          <ContactHero settings={data.settings} navHomeLabel="Home" navContactLabel="Contact" />

          <Container className="flex flex-col gap-16 py-12 lg:gap-20 lg:py-20">
            <div>
              <h2 className="text-center text-h2 text-neutral-900">Get in Touch</h2>
              <div className="mt-10">
                <ContactActionCards
                  settings={data.settings}
                  socialLinks={data.socialLinks}
                  whatsappMessage={whatsappMessage}
                  locationsAnchorId={LOCATIONS_ANCHOR_ID}
                  socialLabel="Social Media"
                  labels={LABELS}
                />
              </div>
            </div>

            <div id={LOCATIONS_ANCHOR_ID}>
              <LocationsWithMap
                locations={data.locations}
                initialLocationId={mainMapLocation?.id ?? null}
                heading="Where to Find PPN"
                subtitle="Connect with our operational locations across Indonesia."
                openInGoogleMapsLabel="Open in Google Maps"
                viewLocationLabel="View Location"
              />
            </div>
          </Container>
        </main>
      )}
    </div>
  );
}
