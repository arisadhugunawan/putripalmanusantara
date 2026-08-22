import type { DecorativeGraphic, GalleryItem } from "@ppn/shared-types";
import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { SectionBackdrop } from "./SectionBackdrop";

/** FR-HOME-08 — gallery preview grid with a link to the full gallery. */
export function GalleryPreview({
  items,
  decorativeGraphics = [],
}: {
  items: GalleryItem[];
  decorativeGraphics?: DecorativeGraphic[];
}) {
  // GalleryGrid's own item shape predates video/YouTube/TikTok support and expects a
  // non-null `media` — the Homepage preview only ever showed real photos, so items without
  // stored media (external video embeds) are filtered out rather than adapting this grid.
  const photoItems = items
    .filter((item): item is typeof item & { media: NonNullable<typeof item.media> } => item.media !== null)
    .map((item) => ({ id: item.id, media: item.media, caption: item.caption }));

  if (photoItems.length === 0) return null;

  return (
    <Section className="relative overflow-hidden">
      <SectionBackdrop orbSide="right" />
      <DecorativeGraphics graphics={decorativeGraphics} />
      <Container className="relative">
        <FadeUpSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
              <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
              A Look Inside PPN
            </p>
            <h2 className="mt-3 max-w-xl text-h2 text-neutral-900">Gallery</h2>
          </div>
          <Link href="/gallery" className={buttonVariants("ghost", "md")}>
            View All Photos →
          </Link>
        </FadeUpSection>
        <FadeUpSection className="mt-10" style={{ transitionDelay: "100ms" }}>
          <GalleryGrid items={photoItems.slice(0, 8)} />
        </FadeUpSection>
      </Container>
    </Section>
  );
}
