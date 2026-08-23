/**
 * UI-chrome strings only (nav, footer, generic buttons, 404) — NOT database content.
 * CMS-backed content (products, articles, facilities, FAQ, etc.) is translated separately
 * via each model's `translations` JSON column; see README "Internationalization" section.
 */
export interface Dictionary {
  nav: {
    home: string;
    aboutCompany: string;
    aboutCompanyProfile: string;
    aboutTeam: string;
    aboutWhatWeDo: string;
    aboutLegalCertificate: string;
    aboutFactory: string;
    ourProducts: string;
    facilitiesAndGallery: string;
    facilities: string;
    facilitiesOverview: string;
    facilitiesProductionProcess: string;
    facilitiesMoqPayment: string;
    facilitiesShipmentTerms: string;
    facilitiesFaq: string;
    gallery: string;
    news: string;
    contact: string;
    requestQuotation: string;
    openMenu: string;
    closeMenu: string;
    language: string;
  };
  footer: {
    tagline: string;
    navigationHeading: string;
    companyHeading: string;
    productsHeading: string;
    quickLinkHeading: string;
    contactHeading: string;
    quoteHeading: string;
    quoteBody: string;
    quoteCta: string;
    rightsReserved: string;
  };
  common: {
    readMore: string;
    viewAll: string;
    viewProducts: string;
  };
  notFound: {
    title: string;
    body: string;
    backHome: string;
    viewProducts: string;
  };
  /** "Our Products" module UI chrome — section headings, page copy, CTAs. Product-specific
   * CONTENT (name, description, specifications, packaging) is translated separately via each
   * model's `translations` JSON column, same as every other CMS-backed module. */
  products: {
    eyebrow: string;
    pageTitle: string;
    pageDescription: string;
    breadcrumbProducts: string;
    noProductsYet: string;
    viewProduct: string;
    description: string;
    specifications: string;
    shapeAndSize: string;
    specLabTest: string;
    productGallery: string;
    detailInformation: string;
    packaging: string;
    applications: string;
    exportInformation: string;
    relatedProducts: string;
    deliveryTerms: string;
    catalogue: string;
    /** Fixed company-wide packaging-type labels shown in the static Delivery/Packaging
     * footer (not per-product CMS content — see DeliveryPackagingFooter.tsx). */
    packagingJuteGunnyBags: string;
    packagingPolypropyleneBags: string;
    packagingPlasticNettedBags: string;
    /** WhatsApp pre-filled message — must contain the literal "{product}" placeholder,
     * substituted with the current product's (already-localized) name. */
    whatsappMessageTemplate: string;
  };
  /** Contact page UI chrome — section headings, button/CTA text, WhatsApp message templates.
   * Real business data (email, WhatsApp number, business hours, office addresses, location
   * labels, social media URLs) is single-language admin content stored in ContactPageSettings/
   * ContactLocation and displayed identically in every locale — see README "Contact Page —
   * Full Redesign" for why that's a deliberate scope decision, not an oversight. */
  contact: {
    metaTitle: string;
    metaDescription: string;
    sectionGetInTouch: string;
    emailLabel: string;
    whatsappLabel: string;
    businessHoursLabel: string;
    openNowLabel: string;
    closedNowLabel: string;
    closedLabel: string;
    weekdayShortMon: string;
    weekdayShortTue: string;
    weekdayShortWed: string;
    weekdayShortThu: string;
    weekdayShortFri: string;
    weekdayShortSat: string;
    weekdayShortSun: string;
    socialMediaLabel: string;
    locationLabel: string;
    sectionOurLocation: string;
    sectionOurLocationSubtitle: string;
    openInGoogleMaps: string;
    viewLocation: string;
    sectionOurProducts: string;
    viewProduct: string;
    whatsappFloatingCta: string;
    /** Middle sentence of the per-product WhatsApp message built by `buildWhatsAppProductMessage()`
     * (`apps/web/src/lib/whatsapp.ts`) — wrapped between the CMS-configured greeting/closing.
     * Must contain the literal "{product}" placeholder. */
    whatsappProductMessageTemplate: string;
  };
  /** Fixed diagram captions for the Shipment Terms route visualization (Facilities page) — the
   * 4 stage labels are structural UI chrome, not admin-editable content, so they live here like
   * every other fixed caption rather than in the CMS `translations` column. */
  shipmentRoute: {
    loading: string;
    container: string;
    shipment: string;
    destination: string;
  };
}
