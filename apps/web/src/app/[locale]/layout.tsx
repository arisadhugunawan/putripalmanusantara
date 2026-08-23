import type { PublicSiteBranding } from "@ppn/shared-types";
import { isLocale, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import { notFound } from "next/navigation";
import { AiFloatingWidgets } from "@/components/ai/AiFloatingWidgets";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleHtmlLang } from "@/i18n/LocaleHtmlLang";
import { getProducts, getPublicAboutCompanyNav, getPublicBranding } from "@/lib/api";
import { DEFAULT_ABOUT_NAV_STATE } from "@/lib/nav-config";

// Header/Footer require a real PublicSiteBranding object (they read fields like
// `branding.header_logo` directly, not optionally) — every slot null/empty is exactly the
// "no branding configured" state the type already documents, so this degrades to the plain
// text wordmark rather than crashing when the branding API is unreachable (P0.4-A).
const EMPTY_BRANDING: PublicSiteBranding = {
  header_logo: null,
  header_logo_alt: "",
  footer_logo: null,
  footer_logo_alt: "",
  mobile_logo: null,
  mobile_logo_alt: "",
  favicon: null,
  product_header_background: null,
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const resolvedLocale = locale as Locale;
  // Fetched here (not inside Header, which is a Client Component) so the "Our Products"
  // dropdown always reflects real CMS slugs/names instead of a hardcoded, driftable list.
  // `aboutNav` drives whether Header/Footer offer the About Company menu at all — it reads the
  // same published snapshot `/about` renders, so the menu can never link to a page or an anchor
  // the Admin has hidden.
  // `.catch()` on the network calls only (not getDictionary, a local file read with nothing
  // to gracefully degrade to) — mirrors app/layout.tsx's existing getPublicBranding() fallback
  // one file up, extended to the fetches this layout also makes. Without this, an API outage
  // throws inside this layout, which wraps every public page (P0.4-A). Fallback values are
  // type-correct non-null defaults (not `null`) since Header/Footer require real objects, not
  // optional ones — `getPublicAboutCompanyNav` already never throws (it has its own internal
  // try/catch falling back to DEFAULT_ABOUT_NAV_STATE), so its `.catch()` here is defense in
  // depth only, kept for consistency with the other two calls.
  const [dictionary, products, branding, aboutNav] = await Promise.all([
    getDictionary(resolvedLocale),
    getProducts(resolvedLocale).catch(() => []),
    getPublicBranding().catch(() => EMPTY_BRANDING),
    getPublicAboutCompanyNav(resolvedLocale).catch(() => DEFAULT_ABOUT_NAV_STATE),
  ]);

  return (
    <>
      <LocaleHtmlLang locale={locale} />
      <Header
        dictionary={dictionary}
        locale={resolvedLocale}
        products={products}
        branding={branding}
        aboutNav={aboutNav}
      />
      {children}
      <Footer dictionary={dictionary} locale={resolvedLocale} branding={branding} aboutNav={aboutNav} />
      <AiFloatingWidgets locale={resolvedLocale} logoUrl={branding.header_logo?.file_url ?? null} />
    </>
  );
}
