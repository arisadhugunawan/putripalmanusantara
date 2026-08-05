import { Container, Section, buttonVariants } from "@ppn/ui-components";
import type { GalleryItem } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

/** FR-HOME-08 — gallery preview grid with a link to the full gallery. */
export function GalleryPreview({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;

  return (
    <Section tone="soft">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-h2 text-neutral-900">Gallery</h2>
          <Link href="/gallery" className={buttonVariants("ghost", "md")}>
            View All Photos →
          </Link>
        </div>
        <div className="mt-10">
          <GalleryGrid items={items.slice(0, 8)} />
        </div>
      </Container>
    </Section>
  );
}
