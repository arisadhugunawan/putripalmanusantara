import type { DecorativeGraphic, HomepageProcessSection, ProductionStep } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DecorativeGraphics } from "@/components/decorative/DecorativeGraphics";
import { ProcessFlowchart } from "./ProcessFlowchart";

/** Homepage wrapper for "Our Supply & Export Process" — header copy (eyebrow/heading/
 * description, all CMS-editable via `HomepageProcessSection`) + the shared interactive
 * flowchart body also used by the standalone `/production-process` page. Renders nothing when
 * there are no active stages, same "nothing to show" convention as every other section here. */
export function ProcessSection({
  section,
  steps,
  decorativeGraphics,
}: {
  section: HomepageProcessSection;
  steps: ProductionStep[];
  decorativeGraphics: DecorativeGraphic[];
}) {
  if (steps.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-primary-50/20 to-white py-(--spacing-section-y-comfortable)">
      {/* Tech/academy-style backdrop — dot-grid texture + soft blurred gradient orbs, layered
       * under the CMS-controlled DecorativeGraphics so an admin's own watermark still shows
       * through on top. Purely decorative: pointer-events-none + aria-hidden. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(74,101,30,0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl"
      />

      <DecorativeGraphics graphics={decorativeGraphics} />

      <Container className="relative">
        <FadeUpSection className="flex flex-col items-center text-center">
          <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
            {section.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
          </p>
          <h2 className="mt-4 max-w-2xl text-h2 text-neutral-900">{section.heading}</h2>
          {section.description && (
            <p className="mt-3 max-w-xl text-body-lg text-neutral-600">{section.description}</p>
          )}
        </FadeUpSection>

        <div className="mt-12 md:mt-16">
          <ProcessFlowchart steps={steps} />
        </div>
      </Container>
    </section>
  );
}
