import type { DecorativeGraphic, HomepageAboutPreview, HomepageHighlight } from "@ppn/shared-types";
import { Container, Section, buttonVariants, cn } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { CompanyVideo } from "./CompanyVideo";
import { HighlightCards } from "./HighlightCards";

/**
 * Homepage "About Company Preview" — replaces the old AboutSummarySection with a richer,
 * fully CMS-managed two-column layout (intro + highlights + CTA / company video). Built as
 * a new component rather than editing the old one in place, same as HeroSlider replacing
 * Hero.tsx — the old file is deleted since nothing else referenced it.
 */
export function AboutPreviewSection({
  preview,
  highlights,
  decorativeGraphics,
}: {
  preview: HomepageAboutPreview;
  highlights: HomepageHighlight[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (!preview.enabled) return null;

  return (
    <Section className="relative overflow-hidden">
      <DecorativeGraphics graphics={decorativeGraphics} />

      {/* Mobile stacks in document order (Intro → Video → Highlights → CTA, per the brief);
          desktop uses row-start/row-span so the video spans the full right-column height
          beside both the intro and the highlights+CTA row on the left. */}
      <Container className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-16">
        <FadeUpSection className="lg:col-start-1 lg:row-start-1">
          <p className="text-small font-medium uppercase tracking-wide text-primary-700">{preview.label}</p>
          <h2 className="mt-3 max-w-[650px] text-h2 text-neutral-900">{preview.heading}</h2>

          <div className="mt-6 flex max-w-[650px] flex-col gap-4 text-body-lg text-neutral-600">
            {preview.paragraph_1 && <p>{preview.paragraph_1}</p>}
            {preview.paragraph_2 && <p>{preview.paragraph_2}</p>}
            {preview.paragraph_3 && <p>{preview.paragraph_3}</p>}
          </div>
        </FadeUpSection>

        <FadeUpSection className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <CompanyVideo preview={preview} />
        </FadeUpSection>

        <FadeUpSection className="lg:col-start-1 lg:row-start-2">
          <HighlightCards highlights={highlights} />

          <Link
            href={preview.cta_link}
            className={cn(
              "group mt-8 inline-flex items-center gap-2",
              buttonVariants("primary", "md"),
            )}
          >
            {preview.cta_text}
            <ArrowIcon />
          </Link>
        </FadeUpSection>
      </Container>
    </Section>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover:translate-x-1"
    >
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
