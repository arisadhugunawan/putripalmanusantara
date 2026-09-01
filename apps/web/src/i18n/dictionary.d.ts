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
    /** Quick Action button label — WhatsApp is a brand name, so this reads identically
     * (or near-identically) across locales, but still flows through the dictionary for
     * architectural consistency with every other interactive label in this module. */
    whatsappCta: string;
    /** Shared lightbox controls — reused by both the overview image viewer and the
     * product gallery grid, which show the same close/prev/next affordances. */
    closeAriaLabel: string;
    previousImageAriaLabel: string;
    nextImageAriaLabel: string;
    /** "Zoom in on {name}" — {name} is replaced with the (already-localized) media alt text. */
    zoomInAriaTemplate: string;
    /** "Play video {index} of {total}" — {index}/{total} are replaced with numbers. */
    playVideoAriaTemplate: string;
    /** "View image {index} of {total}" — {index}/{total} are replaced with numbers. */
    viewImageAriaTemplate: string;
    openPdfDocumentLabel: string;
    /** "View {name} full size" — {name} is replaced with the (already-localized) caption
     * or media alt text. */
    viewFullSizeAriaTemplate: string;
    closeDocumentAriaLabel: string;
    /** aria-label shown on the placeholder graphic when a product has no image yet. */
    imageComingSoonAriaLabel: string;
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
  /** "/facilities" page UI chrome — page title reuses `nav.facilities`/`nav.facilitiesMoqPayment`/
   * `nav.facilitiesShipmentTerms`/`nav.facilitiesFaq` for the breadcrumb and section-nav tabs
   * (already professionally translated there); this namespace covers everything else that has
   * no CMS field of its own. Facility/MOQ/Shipment/FAQ CONTENT is CMS-backed and already
   * locale-resolved via `translate()`. */
  facilities: {
    pageDescription: string;
    metaDescriptionFallback: string;
    navAriaLabel: string;
    noFacilitiesYet: string;
    introDescription: string;
    viewPhotosCta: string;
    exploreOperationsCta: string;
    scrollLeftAriaLabel: string;
    scrollRightAriaLabel: string;
    /** Must contain the literal "{name}" placeholder. */
    openPhotoFullscreenAriaTemplate: string;
    previousPhotoAriaLabel: string;
    nextPhotoAriaLabel: string;
    facilityTypeLabel: string;
    facilityStatusLabel: string;
    imageComingSoonAriaLabel: string;
    businessTermsUnavailable: string;
    documentationTitle: string;
    documentationDescription: string;
    showDocumentsLabel: string;
    hideDocumentsLabel: string;
    shippingScheduleTitle: string;
    shippingScheduleSubtitle: string;
    containerSizeAriaLabel: string;
    /** Must contain the literal "{label}" placeholder — word order may differ per language. */
    containerSuffixTemplate: string;
    lightboxZoomOutLabel: string;
    lightboxZoomInLabel: string;
    lightboxFitToScreenLabel: string;
    lightboxFitShortLabel: string;
    lightboxExitFullscreenLabel: string;
    lightboxFullscreenLabel: string;
    lightboxCloseLabel: string;
    lightboxPreviousLabel: string;
    lightboxNextLabel: string;
    lightboxPrevShort: string;
    lightboxNextShort: string;
    /** Must contain the literal "{name}" placeholder. */
    lightboxAriaTemplate: string;
  };
  /** "/production-process" page UI chrome — title/breadcrumb reuse
   * `nav.facilitiesProductionProcess` (already translated); step CONTENT is the shared
   * `ProductionStep` CMS data, already locale-resolved via `translate()`. */
  productionProcess: {
    pageDescription: string;
    metaDescriptionFallback: string;
  };
  /** "/articles" listing + "/articles/[slug]" detail page UI chrome. Reuses `nav.home` for the
   * breadcrumb's first crumb and `home.articles.readArticleCta`/`viewOnInstagramCta`/
   * `instagramBadge` (already translated for the Homepage carousel) via `ArticleCard`'s own
   * optional dictionary prop — this namespace only covers strings with no existing equivalent.
   * Article CONTENT (title/excerpt/body/category/tags) is CMS-backed and already
   * locale-resolved via `translate()`. */
  articles: {
    pageTitle: string;
    metaDescription: string;
    breadcrumbArticles: string;
    breadcrumbInsights: string;
    featuredBadge: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchButton: string;
    allCategoriesLabel: string;
    noResultsMessage: string;
    noArticlesMessage: string;
    paginationAriaLabel: string;
    /** Must contain the literal "{minutes}" placeholder. */
    minReadTemplate: string;
    galleryHeading: string;
    /** Must contain the literal "{name}" placeholder. */
    lightboxImageAriaTemplate: string;
    lightboxCloseLabel: string;
    lightboxPreviousLabel: string;
    lightboxNextLabel: string;
    alsoSharedOnInstagramText: string;
    relatedInsightsEyebrow: string;
    relatedInsightsHeading: string;
    backToInsightsCta: string;
    keyTakeawaysLabel: string;
    backToTopAriaLabel: string;
    shareWhatsappLabel: string;
    shareFacebookLabel: string;
    shareLinkedinLabel: string;
    shareXLabel: string;
    copyLinkLabel: string;
    linkCopiedLabel: string;
    printArticleLabel: string;
  };
  /** "/gallery" page UI chrome — reuses `nav.gallery` ("Gallery") for the breadcrumb second
   * crumb and the SEO title fallback. Gallery ITEM content (media, captions, category names)
   * is CMS-backed and already locale-resolved via `translate()`; the "Products"/"Team" virtual
   * categories reuse the real Products/Team data (already locale-resolved elsewhere) — this
   * namespace only covers static UI chrome with no CMS field of its own. */
  gallery: {
    metaDescription: string;
    heroEyebrow: string;
    /** Shown only when the Admin hasn't set a custom Page Header title for Gallery. */
    heroFallbackTitle: string;
    heroFallbackDescription: string;
    /** Appended after `heroFallbackDescription` when at least one photo exists. Must contain
     * the literal "{count}" placeholder. */
    heroMomentsCapturedTemplate: string;
    comingSoonHeading: string;
    comingSoonDescription: string;
    /** Must contain the literal "{category}" placeholder. */
    categoryEmptyTemplate: string;
    categoryEmptyDescription: string;
    /** Lowercase word substituted into `categoryEmptyTemplate` for the unfiltered "All" view. */
    allCategoryFallbackName: string;
    /** "Products" virtual category card description (real Products data, never duplicated
     * into GalleryItem rows). */
    productsCategoryDescription: string;
    /** "Team" virtual category card description (real Team data, never duplicated into
     * GalleryItem rows). */
    teamCategoryDescription: string;
    featuredEyebrow: string;
    featuredHeading: string;
    journeyEyebrow: string;
    journeyHeading: string;
    filterAriaLabel: string;
    allFilterLabel: string;
    /** Must contain the literal "{name}" placeholder. */
    viewFullscreenAriaTemplate: string;
    viewGalleryCta: string;
    tiktokVideoLabel: string;
    videoLabel: string;
    itemCountComingSoonLabel: string;
    /** aria-label on the placeholder graphic when a category preview has no image yet. */
    imageComingSoonAriaLabel: string;
    /** Used when a gallery item has neither its own alt text nor a title. */
    lightboxFallbackAlt: string;
    /** Must contain the literal "{count}" placeholder. */
    photoCountSingularTemplate: string;
    /** Must contain the literal "{count}" placeholder. */
    photoCountPluralTemplate: string;
    lightboxZoomOutLabel: string;
    lightboxZoomInLabel: string;
    lightboxFitToScreenLabel: string;
    lightboxFitShortLabel: string;
    lightboxExitFullscreenLabel: string;
    lightboxFullscreenLabel: string;
    lightboxCloseLabel: string;
    lightboxPreviousLabel: string;
    lightboxNextLabel: string;
    lightboxPrevShort: string;
    lightboxNextShort: string;
    /** Must contain the literal "{name}" placeholder. */
    lightboxAriaTemplate: string;
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
  /** About Company page ("/about") static UI chrome — same split as `home`: section headings/
   * intros/CTAs come from the CMS and are already locale-resolved server-side via `translate()`;
   * this namespace covers only text that has no CMS field (legal-table row labels, empty
   * states, document-viewer toolbar, carousel/modal accessibility labels, fixed document-type
   * fallback labels). */
  aboutCompany: {
    breadcrumbLabel: string;
    pageTitleFallback: string;
    seoTitleFallback: string;
    seoDescriptionFallback: string;
    sectionsNavAriaLabel: string;
    companyProfile: {
      legalCompanyName: string;
      legalBusinessType: string;
      legalRegisteredAddress: string;
      legalBusinessId: string;
      legalEstablished: string;
      viewLegalDocsCta: string;
      videoUnavailable: string;
      playVideoAriaLabel: string;
      companyVideoTitle: string;
      closeModalAriaLabel: string;
    };
    team: {
      memberSingular: string;
      memberPlural: string;
      emptyState: string;
      featuredBadge: string;
      viewProfileCta: string;
      /** Full accessible name for the "View profile" link, set via `aria-label` (not a bolted-on
       * suffix) so word order can differ per language — must contain the literal "{name}"
       * placeholder, e.g. "View profile of {name}" / "查看{name}的资料". */
      viewProfileAriaTemplate: string;
      /** "— portrait coming soon" — appended after the member's name in the placeholder's aria-label. */
      portraitComingSoonSuffix: string;
      modalEmailLabel: string;
      modalPhoneLabel: string;
      modalLinkedInLabel: string;
      modalLinkedInLinkText: string;
      modalResponsibilitiesHeading: string;
      modalCloseAriaLabel: string;
    };
    whatWeDo: {
      emptyState: string;
      carouselAriaLabel: string;
      viewProductCta: string;
      prevAriaLabel: string;
      nextAriaLabel: string;
    };
    legalCertificate: {
      verifiedDocumentSingular: string;
      verifiedDocumentPlural: string;
      documentSingular: string;
      documentPlural: string;
      emptyState: string;
      contactUsCta: string;
      filterAll: string;
      verifiedBadge: string;
      viewDocumentCta: string;
      placeholderPdf: string;
      placeholderGeneric: string;
      /** Appended after " — " in the viewer's aria-label, e.g. `${doc.title} — ${viewerAriaSuffix}`. */
      viewerAriaSuffix: string;
      zoomOut: string;
      zoomIn: string;
      resetZoom: string;
      fitToScreen: string;
      fitShort: string;
      exitFullscreen: string;
      fullscreen: string;
      /** Full aria-label template — must contain "{title}", e.g. "Open original file for {title}". */
      openOriginalAriaTemplate: string;
      openOriginal: string;
      /** Full aria-label template — must contain "{title}", e.g. "Download {title}". */
      downloadAriaTemplate: string;
      download: string;
      closeViewer: string;
      loadingFullRes: string;
      prevDocumentAriaLabel: string;
      prevShort: string;
      nextDocumentAriaLabel: string;
      nextShort: string;
      unableToLoad: string;
      retry: string;
      downloadOriginal: string;
      close: string;
      /** Fixed fallback labels for `LegalDocumentType`, used only when a document has no
       * Admin-assigned category — mirrors `LEGAL_DOCUMENT_TYPE_LABELS` in `@ppn/shared-types`. */
      typeCertificate: string;
      typeLegalDocument: string;
      typeBusinessLicense: string;
      typeRegistrationDocument: string;
      typeExportCertificate: string;
      typeQualityCertificate: string;
      typeOther: string;
    };
    factory: {
      pictureHeading: string;
      pictureDescription: string;
      viewAllFacilitiesCta: string;
      galleryScrollableAriaLabel: string;
      /** Full aria-label template — must contain "{title}", e.g. "View {title} fullscreen". */
      viewFullscreenAriaTemplate: string;
      /** Lowercase, used inline mid-sentence when a photo has no title. */
      photoFallbackTitle: string;
      photoFallbackAlt: string;
      photoFallbackAltShort: string;
      viewImageCta: string;
      prevPhotoAriaLabel: string;
      nextPhotoAriaLabel: string;
      videosScrollableAriaLabel: string;
      videoLabel: string;
      watchOnTikTokCta: string;
      watchOnTikTokAriaLabel: string;
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
