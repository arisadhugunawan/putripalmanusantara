import { isLocale, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleHtmlLang } from "@/i18n/LocaleHtmlLang";
import { getProducts } from "@/lib/api";

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
  const [dictionary, products] = await Promise.all([
    getDictionary(resolvedLocale),
    getProducts(resolvedLocale),
  ]);

  return (
    <>
      <LocaleHtmlLang locale={locale} />
      <Header dictionary={dictionary} locale={resolvedLocale} products={products} />
      {children}
      <Footer dictionary={dictionary} locale={resolvedLocale} />
    </>
  );
}
