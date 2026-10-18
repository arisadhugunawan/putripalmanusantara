import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Origin of the API (media uploads, PDF documents, client-side fetches), e.g. http://localhost:4000.
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").origin;

/** Every third party the site actually embeds: YouTube/Vimeo videos, the Google Maps contact
 * embed, and TikTok (embed.js plus the iframe and assets it loads). PDFs are shown with
 * <object> straight from the API or object storage, hence object-src. Shipped as
 * Report-Only first so a missing source is logged in the browser console instead of
 * breaking a page; switch the header name to Content-Security-Policy once reports are clean. */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.tiktok.com https://*.tiktokcdn.com https://*.ttwstatic.com`,
  "style-src 'self' 'unsafe-inline' https://*.ttwstatic.com",
  `img-src 'self' data: blob: https: ${apiOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}${isDev ? " ws: wss:" : ""}`,
  `media-src 'self' blob: https: ${apiOrigin}`,
  `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com https://www.tiktok.com ${apiOrigin}`,
  `object-src 'self' https: ${apiOrigin}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@ppn/ui-components"],
  // Lets the dev server be reached from another device on the same LAN (e.g. a phone) without
  // Next's dev-resource cross-origin protection blocking HMR/asset requests.
  allowedDevOrigins: ["192.168.88.207"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      // Local media storage (docs/06-architecture.md §2 — MEDIA_STORAGE_DRIVER=local in dev)
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      // Same dev machine, reached via its LAN IP instead of localhost — needed so the site
      // still renders images when opened from another device (e.g. a phone) on the same Wi-Fi.
      { protocol: "http", hostname: "192.168.88.207", port: "4000", pathname: "/uploads/**" },
      // Production API on Render (docs/06-architecture.md §9 — backend hosting) — Render's
      // generated domains are always a subdomain of onrender.com, so this wildcard covers the
      // real service domain without needing to know it ahead of time. Still applies with
      // MEDIA_STORAGE_DRIVER=local, since local uploads are served back through the API itself.
      { protocol: "https", hostname: "**.onrender.com", pathname: "/uploads/**" },
      // S3-compatible object storage in production, once S3_PUBLIC_URL is configured.
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
    // Next 16.0.0 added SSRF protection that blocks optimizing images whose hostname
    // resolves to a loopback/private IP — `localhost` always does, so it broke every
    // media preview under the local storage driver above. Safe here: remotePatterns
    // only ever allows that one fixed dev host plus specific production CDN domains,
    // never attacker-controlled input.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
