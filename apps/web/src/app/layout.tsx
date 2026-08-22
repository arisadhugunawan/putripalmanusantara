import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/json-ld";
import { getPublicBranding } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const DEFAULT_DESCRIPTION =
  "CV Putri Palma Nusantara exports Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber to buyers across Asia, the Middle East, and Europe.";

export async function generateMetadata(): Promise<Metadata> {
  // Admin-uploaded Favicon (Brand & Logo) — best-effort: if the API is unreachable, fall back
  // to Next's static app/favicon.ico file convention instead of breaking every page's <head>.
  const branding = await getPublicBranding().catch(() => null);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: "/" },
    ...(branding?.favicon && {
      icons: { icon: branding.favicon.file_url, shortcut: branding.favicon.file_url },
    }),
    openGraph: {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Next only allows one root <html> document for the whole app (admin stays outside
  // app/[locale]/, always Indonesian). `lang` defaults to "en" here and is corrected
  // client-side by <LocaleHtmlLang> inside app/[locale]/layout.tsx — reading the real
  // locale here would require a dynamic API (cookies/headers), which would opt the
  // entire site out of static generation (docs/06-architecture.md §4 SSG+ISR).
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* NFR-SEO-01 — Organization schema on every page. */}
        <JsonLd data={organizationJsonLd()} />
        {children}
      </body>
    </html>
  );
}
