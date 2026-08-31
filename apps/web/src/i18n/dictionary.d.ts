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
    /** aria-label prefix for a social icon link, e.g. "Open" + " Instagram". */
    openSocialLinkPrefix: string;
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
    overview: string;
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
  /** Homepage-only static UI chrome — eyebrows, headings with no CMS field, CTA labels, and
   * carousel/map accessibility labels. Section CONTENT (hero slides, product/facility/article
   * data, export destination details) is CMS-backed and already locale-resolved server-side via
   * `translate()` — this namespace never duplicates that, it only covers text that has no CMS
   * field to begin with. */
  home: {
    hero: {
      /** Shown only when zero CMS hero slides are configured. */
      fallbackTitle: string;
      fallbackSubtitle: string;
      ariaLabel: string;
      ariaPrevSlide: string;
      ariaNextSlide: string;
      /** "Go to slide" — the slide number is appended at the call site, e.g. `${ariaGoToSlide} 2`. */
      ariaGoToSlide: string;
    };
    companyVideo: {
      /** "Play video:" — the CMS heading is appended at the call site. */
      playVideoPrefix: string;
    };
    products: {
      eyebrow: string;
      heading: string;
      viewAllCta: string;
      viewDetailsCta: string;
      /** "View details for" — the product's (already-localized) name is appended. */
      viewDetailsAriaPrefix: string;
    };
    facilities: {
      eyebrow: string;
      heading: string;
      description: string;
      viewAllCta: string;
      ariaSlide: string;
      ariaGoToFacility: string;
      ariaPrevFacility: string;
      ariaNextFacility: string;
    };
    gallery: {
      eyebrow: string;
      heading: string;
      viewAllCta: string;
    };
    articles: {
      eyebrow: string;
      heading: string;
      viewAllCta: string;
      ariaSlide: string;
      ariaGoToArticle: string;
      ariaPrevArticle: string;
      ariaNextArticle: string;
      instagramBadge: string;
      readArticleCta: string;
      viewOnInstagramCta: string;
    };
    /** "Global Export Reach" interactive-map section. `region`/`export_volume`/
     * `export_frequency`/`destination_port` and every country name remain admin/data-sourced
     * and are NOT translated here — see README "Internationalization" for why. */
    exportReach: {
      /** "Serving" — the destination count is appended, e.g. `${servingPrefix} 12 ${destinationPlural}`. */
      servingPrefix: string;
      destinationSingular: string;
      destinationPlural: string;
      statusActive: string;
      statusPrevious: string;
      statusPotential: string;
      statusInactive: string;
      selectCountryPrompt: string;
      productsLabel: string;
      exportVolumeLabel: string;
      frequencyLabel: string;
      destinationPortLabel: string;
      searchPlaceholder: string;
      searchAriaLabel: string;
      /** "No destination matches" — the search query is appended in quotes at the call site. */
      noMatchesPrefix: string;
      mapAriaLabel: string;
      /** Appended after an em dash in the map tooltip/aria-label, e.g. `${countryName} — ${tooltipSuffix}`. */
      tooltipSuffix: string;
      mobileSelectLabel: string;
      mobileSelectPlaceholder: string;
    };
    faq: {
      eyebrow: string;
      heading: string;
    };
    quotation: {
      eyebrow: string;
      heading: string;
      description: string;
    };
  };
  /** `QuotationForm` — shared across the Homepage CTA, Product detail pages, and elsewhere via
   * `sourcePage`, so it lives at the top level rather than nested under `home`. */
  quotationForm: {
    nameLabel: string;
    companyLabel: string;
    countryLabel: string;
    emailLabel: string;
    phoneLabel: string;
    /** Shown when the product is fixed (e.g. on a Product detail page) as a read-only label. */
    productFixedLabel: string;
    productLabel: string;
    productPlaceholder: string;
    quantityLabel: string;
    quantityPlaceholder: string;
    messageLabel: string;
    submitCta: string;
    submittingCta: string;
    successTitle: string;
    successBody: string;
    genericError: string;
    nameRequired: string;
    companyRequired: string;
    countryRequired: string;
    emailInvalid: string;
    messageRequired: string;
    /** Anti-spam honeypot field label — invisible to real visitors, kept translated only for
     * consistency with every other form label. */
    websiteHoneypotLabel: string;
  };
}
