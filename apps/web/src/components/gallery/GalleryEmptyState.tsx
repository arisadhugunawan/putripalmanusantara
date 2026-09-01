import { Container } from "@ppn/ui-components";
import type { Dictionary } from "@/i18n/dictionary.d";
import { CoconutMark } from "@/components/SafeImage";

/** Whole-page empty state — every real (non-virtual) category has zero active items. Never a
 * broken/missing-image grid; an honest, on-brand "nothing uploaded yet" moment (brief §48/§59:
 * no fake warehouses/employees/shipments as filler). */
export function GalleryEmptyState({ dictionary }: { dictionary: Dictionary["gallery"] }) {
  return (
    <Container className="py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
        <CoconutMark className="h-10 w-10 text-primary-600/50" />
      </div>
      <h2 className="mt-6 text-h2 text-neutral-900">{dictionary.comingSoonHeading}</h2>
      <p className="mx-auto mt-3 max-w-md text-body text-neutral-600">{dictionary.comingSoonDescription}</p>
    </Container>
  );
}

/** Per-category empty state — inside the journey/showcase panels when a real category has no
 * active items yet. */
export function GalleryCategoryEmptyState({
  categoryName,
  dictionary,
}: {
  categoryName: string;
  dictionary: Dictionary["gallery"];
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <CoconutMark className="h-8 w-8 text-primary-600/40" />
      <p className="text-body font-medium text-neutral-700">
        {dictionary.categoryEmptyTemplate.replace("{category}", categoryName)}
      </p>
      <p className="max-w-xs text-small text-neutral-500">{dictionary.categoryEmptyDescription}</p>
    </div>
  );
}
