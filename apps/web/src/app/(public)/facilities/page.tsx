import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getFacilities, getGallery } from "@/lib/api";
import { FacilityGrid } from "@/components/facilities/FacilityGrid";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { PageHeader } from "@/components/page/PageHeader";

export const metadata: Metadata = {
  title: "Facilities | CV Putri Palma Nusantara",
  description:
    "Warehouse, loading area, weighbridge, quality control, and container stuffing facilities at CV Putri Palma Nusantara.",
};

// FR-FAC-01/02/03 — facility grid plus a separate drone (aerial) gallery.
export default async function FacilitiesPage() {
  const [facilities, droneItems] = await Promise.all([getFacilities(), getGallery("drone")]);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Facilities" }]}
        title="Our Facilities"
        description="Purpose-built infrastructure supporting consistent, export-ready production."
      />
      <Section>
        <Container>
          {facilities.length === 0 ? (
            <p className="text-body text-neutral-600">No facility information available yet.</p>
          ) : (
            <FacilityGrid facilities={facilities} />
          )}
        </Container>
      </Section>

      {droneItems.length > 0 && (
        <Section tone="soft">
          <Container>
            <h2 className="text-h2 text-neutral-900">Aerial View</h2>
            <p className="mt-2 max-w-xl text-body text-neutral-600">
              A drone&apos;s-eye view of our facility layout and operations.
            </p>
            <div className="mt-8">
              <GalleryGrid items={droneItems.map((item) => ({ id: item.id, media: item.media, caption: item.caption }))} />
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}
