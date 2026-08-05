import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { getGallery } from "@/lib/api";
import { GalleryPageClient } from "@/components/gallery/GalleryPageClient";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Gallery",
    description: "Photos and videos of our products, facilities, production process, and aerial views.",
    path: "/gallery",
    locale,
  });
}

// FR-GAL-01/02/03
export default async function GalleryPage({ params }: PageProps<"/[locale]/gallery">) {
  const { locale } = await params;
  const items = await getGallery(undefined, locale);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
        title="Gallery"
        locale={locale}
      />
      <Section>
        <Container>
          <GalleryPageClient items={items} />
        </Container>
      </Section>
    </main>
  );
}
