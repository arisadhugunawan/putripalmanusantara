import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/json-ld";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
