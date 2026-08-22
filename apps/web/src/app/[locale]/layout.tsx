import { isLocale, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import { notFound } from "next/navigation";
import { AiFloatingWidgets } from "@/components/ai/AiFloatingWidgets";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleHtmlLang } from "@/i18n/LocaleHtmlLang";
import { getProducts, getPublicAboutCompanyNav, getPublicBranding } from "@/lib/api";

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
  const [dictionary, products, branding, aboutNav] = await Promise.all([
    getDictionary(resolvedLocale),
    getProducts(resolvedLocale),
    getPublicBranding(),
    getPublicAboutCompanyNav(resolvedLocale),
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
