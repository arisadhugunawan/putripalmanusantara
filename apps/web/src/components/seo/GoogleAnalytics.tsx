import Script from "next/script";

/** GA4 measurement IDs look like "G-XXXXXXXXXX"; anything else is ignored rather than
 * interpolated into the inline snippet below. */
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

/** Google Analytics 4 (gtag.js) for the public site only — rendered by `[locale]/layout.tsx`,
 * never by the admin panel. Inert unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set at build time. */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId || !MEASUREMENT_ID_PATTERN.test(measurementId)) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
    </>
  );
}
