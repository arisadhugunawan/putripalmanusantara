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
    facilitiesPackagingOptions: string;
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
}
