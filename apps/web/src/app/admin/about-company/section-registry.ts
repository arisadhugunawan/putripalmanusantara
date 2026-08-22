import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { AboutCompanySectionKey } from "@ppn/shared-types";

export interface AboutCompanySectionRegistryEntry {
  key: AboutCompanySectionKey;
  label: string;
  description: string;
  editors: ComponentType[];
}

// Order here is cosmetic only (TypeScript completeness / registry lookup); the actual page
// order always comes from `AboutCompanySectionConfig` at runtime — same convention as the
// Homepage Manager's `SECTION_REGISTRY`.
export const ABOUT_COMPANY_SECTION_REGISTRY: AboutCompanySectionRegistryEntry[] = [
  {
    key: "company",
    label: "CV. Putri Palma Nusantara",
    description: "Company profile and introduction",
    editors: [dynamic(() => import("./_editors/CompanyProfileEditor").then((m) => m.CompanyProfileEditor))],
  },
  {
    key: "team",
    label: "PPN Team",
    description: "Team and organizational information",
    editors: [
      dynamic(() => import("./_editors/team/TeamSectionCopyEditor").then((m) => m.TeamSectionCopyEditor)),
      dynamic(() => import("./_editors/TeamEditor").then((m) => m.TeamEditor)),
    ],
  },
  {
    key: "what_we_do",
    label: "What We Supply",
    description: "Product cards, Who We Supply, and Buyer/Supplier CTAs",
    editors: [
      dynamic(() =>
        import("./_editors/what-we-do/WhatWeDoSectionCopyEditor").then((m) => m.WhatWeDoSectionCopyEditor),
      ),
      dynamic(() => import("./_editors/WhatWeDoEditor").then((m) => m.WhatWeDoEditor)),
      dynamic(() => import("./_editors/what-we-do/WhoWeSupplyEditor").then((m) => m.WhoWeSupplyEditor)),
    ],
  },
  {
    key: "legal_certificate",
    label: "Legal & Company Information",
    description: "Legal documents, certificates and compliance records",
    editors: [
      dynamic(() => import("./_editors/legal/LegalSectionCopyEditor").then((m) => m.LegalSectionCopyEditor)),
      dynamic(() => import("./_editors/LegalCertificateEditor").then((m) => m.LegalCertificateEditor)),
    ],
  },
  {
    key: "factory",
    label: "Factory",
    description: "Factory, warehouse, facilities and gallery",
    editors: [dynamic(() => import("./_editors/FactoryEditor").then((m) => m.FactoryEditor))],
  },
  {
    key: "facilities",
    label: "Facilities",
    description: "Facility navigation and photo gallery for the public showcase",
    editors: [
      dynamic(() =>
        import("./_editors/facilities/FacilitiesSectionCopyEditor").then(
          (m) => m.FacilitiesSectionCopyEditor,
        ),
      ),
      dynamic(() => import("./_editors/FacilitiesEditor").then((m) => m.FacilitiesEditor)),
    ],
  },
  {
    key: "moq_payment_terms",
    label: "MOQ & Payment Terms",
    description: "Ordering terms, quick overview cards, supply capacity, and CTA for the Facilities page",
    editors: [
      dynamic(() =>
        import("./_editors/moq-payment/MoqPaymentSectionCopyEditor").then(
          (m) => m.MoqPaymentSectionCopyEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/moq-payment/MoqPaymentQuickCardsEditor").then(
          (m) => m.MoqPaymentQuickCardsEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/moq-payment/MoqPaymentBusinessTermsEditor").then(
          (m) => m.MoqPaymentBusinessTermsEditor,
        ),
      ),
    ],
  },
  {
    key: "shipment_terms",
    label: "Shipment Terms",
    description:
      "Shipping arrangement, loading locations, container types, schedule, documentation, and commitment for the Facilities page",
    editors: [
      dynamic(() =>
        import("./_editors/shipment-terms/ShipmentTermsSectionCopyEditor").then(
          (m) => m.ShipmentTermsSectionCopyEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/shipment-terms/ShippingArrangementEditor").then(
          (m) => m.ShippingArrangementEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/shipment-terms/ShipmentLoadingLocationsEditor").then(
          (m) => m.ShipmentLoadingLocationsEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/shipment-terms/ShipmentContainerTypesEditor").then(
          (m) => m.ShipmentContainerTypesEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/shipment-terms/ShipmentScheduleEditor").then(
          (m) => m.ShipmentScheduleEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/shipment-terms/ShipmentDocumentsEditor").then(
          (m) => m.ShipmentDocumentsEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/shipment-terms/ShipmentCommitmentEditor").then(
          (m) => m.ShipmentCommitmentEditor,
        ),
      ),
    ],
  },
  {
    key: "facilities_faq",
    label: "FAQ",
    description: "Frequently asked questions, product tags, and CTA for the Facilities page",
    editors: [
      dynamic(() =>
        import("./_editors/facilities-faq/FacilitiesFaqSectionCopyEditor").then(
          (m) => m.FacilitiesFaqSectionCopyEditor,
        ),
      ),
      dynamic(() =>
        import("./_editors/facilities-faq/FacilitiesFaqItemsEditor").then(
          (m) => m.FacilitiesFaqItemsEditor,
        ),
      ),
    ],
  },
];

export function getAboutCompanySectionRegistryEntry(key: string) {
  return ABOUT_COMPANY_SECTION_REGISTRY.find((s) => s.key === key);
}
