import type {
  AboutCompanyShipmentTermsSection,
  ShipmentCommitmentItem,
  ShipmentContainerType,
  ShipmentDocument,
  ShipmentLoadingLocation,
  ShipmentScheduleStep,
  ShippingArrangementItem,
} from "@ppn/shared-types";
import { buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { FadeUpSection } from "@/components/about/FadeUpSection";
import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";
import { ShipmentCommitmentCards } from "./ShipmentCommitmentCards";
import { ShipmentDocumentsDisclosure } from "./ShipmentDocumentsDisclosure";
import { ShipmentInfoCards } from "./ShipmentInfoCards";
import type { ShipmentRouteLabels } from "./ShipmentRouteVisual";
import { ShipmentRouteVisual } from "./ShipmentRouteVisual";
import { ShipmentScheduleTimeline } from "./ShipmentScheduleTimeline";

/** "Shipment Terms" panel on `/facilities` — replaces the old hardcoded `InfoCardGrid`-based
 * section. Same contained `rounded-3xl` panel treatment as `MoqPaymentTermsSection.tsx`, plus a
 * faint `leaf_outline` corner accent (brief's "premium agriculture export" background ask). */
export function ShipmentTermsSection({
  section,
  arrangementItems,
  loadingLocations,
  containerTypes,
  scheduleSteps,
  documents,
  commitmentItems,
  routeLabels,
}: {
  section: AboutCompanyShipmentTermsSection;
  arrangementItems: ShippingArrangementItem[];
  loadingLocations: ShipmentLoadingLocation[];
  containerTypes: ShipmentContainerType[];
  scheduleSteps: ShipmentScheduleStep[];
  documents: ShipmentDocument[];
  commitmentItems: ShipmentCommitmentItem[];
  routeLabels?: ShipmentRouteLabels;
}) {
  const LeafOutline = DECORATIVE_SVGS.leaf_outline;

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
      <LeafOutline
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 text-primary-900 opacity-[0.04]"
      />

      <div className="relative">
        <FadeUpSection style={{ transitionDelay: "0ms" }} className="text-center">
          <p className="flex items-center justify-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-primary-700">
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
            {section.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-primary-400" />
          </p>
          <h2 className="mt-4 text-h2 text-neutral-900">{section.heading}</h2>
          <p className="mx-auto mt-3 line-clamp-2 max-w-2xl text-body-lg text-neutral-600 lg:line-clamp-3">
            {section.introduction}
          </p>
        </FadeUpSection>

        <FadeUpSection style={{ transitionDelay: "80ms" }} className="mt-12">
          <ShipmentRouteVisual locations={loadingLocations} containerTypes={containerTypes} labels={routeLabels} />
        </FadeUpSection>

        <FadeUpSection style={{ transitionDelay: "200ms" }} className="mt-12">
          <ShipmentInfoCards items={arrangementItems} />
        </FadeUpSection>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FadeUpSection style={{ transitionDelay: "240ms" }}>
            <ShipmentScheduleTimeline steps={scheduleSteps} />
          </FadeUpSection>
          <FadeUpSection style={{ transitionDelay: "280ms" }}>
            <ShipmentDocumentsDisclosure documents={documents} />
          </FadeUpSection>
        </div>

        <FadeUpSection style={{ transitionDelay: "320ms" }} className="mt-12">
          <h3 className="text-center text-h3 text-neutral-900">{section.commitment_title}</h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-body text-neutral-600">{section.commitment_description}</p>
          <div className="mt-6">
            <ShipmentCommitmentCards items={commitmentItems} />
          </div>
        </FadeUpSection>

        <FadeUpSection style={{ transitionDelay: "360ms" }} className="mt-10 text-center">
          <Link
            href={section.cta_href}
            target={section.cta_open_new_tab ? "_blank" : undefined}
            rel={section.cta_open_new_tab ? "noopener noreferrer" : undefined}
            className={`inline-flex ${buttonVariants("primary", "md")}`}
          >
            {section.cta_label}
          </Link>
        </FadeUpSection>
      </div>
    </div>
  );
}
