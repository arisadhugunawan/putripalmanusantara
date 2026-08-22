import type { AboutCompanyMoqPaymentSection, MoqPaymentBusinessTerm, MoqPaymentQuickCard } from "@ppn/shared-types";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { MoqPaymentBusinessTermsPanel } from "./MoqPaymentBusinessTermsPanel";
import { MoqPaymentQuickCards } from "./MoqPaymentQuickCards";

/** "MOQ & Payment Terms" panel on `/facilities` — replaces the old hardcoded
 * `InfoCardGrid`-based section. Contained `rounded-3xl` card (not full-bleed) since it lives
 * inside the page's existing sidebar+content grid; background dot-grid + gradient orbs reuse
 * `SupplyNetworkSection.tsx`'s exact tokens, scoped to this panel only. */
export function MoqPaymentTermsSection({
  section,
  quickCards,
  businessTerms,
}: {
  section: AboutCompanyMoqPaymentSection;
  quickCards: MoqPaymentQuickCard[];
  businessTerms: MoqPaymentBusinessTerm[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-linear-to-b from-white via-primary-50/20 to-white p-6 sm:p-10">
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
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl"
      />

      <div className="relative">
        <FadeUpSection style={{ transitionDelay: "0ms" }}>
          <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
            {section.eyebrow}
          </p>
          <h2 className="mt-4 text-h2 text-neutral-900">{section.heading}</h2>
          <p className="mt-3 max-w-2xl text-body-lg text-neutral-600">{section.introduction}</p>
        </FadeUpSection>

        <FadeUpSection style={{ transitionDelay: "80ms" }} className="mt-10">
          <MoqPaymentQuickCards cards={quickCards} />
        </FadeUpSection>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <FadeUpSection style={{ transitionDelay: "160ms" }}>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h3 className="text-h3 text-neutral-900">{section.supply_capacity_title}</h3>
                <p className="mt-2 text-body text-neutral-600">{section.supply_capacity_description}</p>
              </div>
            </FadeUpSection>

            <FadeUpSection style={{ transitionDelay: "200ms" }}>
              <div className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-white/70 p-6 shadow-[0_20px_60px_-24px_rgba(74,101,30,0.35)] backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-primary-500/25 via-primary-400/10 to-transparent blur-3xl"
                />
                <p className="relative text-h3 text-neutral-900">{section.commitment_title}</p>
                <p className="relative mt-3 text-body text-neutral-600">{section.commitment_description}</p>
              </div>
            </FadeUpSection>
          </div>

          <FadeUpSection style={{ transitionDelay: "240ms" }}>
            <MoqPaymentBusinessTermsPanel terms={businessTerms} />
          </FadeUpSection>
        </div>
      </div>
    </div>
  );
}
