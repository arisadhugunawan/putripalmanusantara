import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getGallery } from "@/lib/api";
import { GalleryPageClient } from "@/components/gallery/GalleryPageClient";
import { PageHeader } from "@/components/page/PageHeader";

export const metadata: Metadata = {
  title: "Gallery | CV Putri Palma Nusantara",
  description: "Photos and videos of our products, facilities, production process, and aerial views.",
};

// FR-GAL-01/02/03
export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
        title="Gallery"
      />
      <Section>
        <Container>
          <GalleryPageClient items={items} />
        </Container>
      </Section>
    </main>
  );
}
