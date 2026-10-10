import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ppn/ui-components"],
  // Lets the dev server be reached from another device on the same LAN (e.g. a phone), and from
  // the temporary Cloudflare quick-tunnel public URL, without Next's dev-resource cross-origin
  // protection blocking HMR/asset requests. The tunnel hostname changes every time it restarts
  // (a fresh `cloudflared tunnel --url` run, e.g. after a Mac restart) — update this when that
  // happens.
  allowedDevOrigins: ["192.168.88.207", "bike-ctrl-when-penalties.trycloudflare.com"],
  images: {
    remotePatterns: [
      // Local media storage (docs/06-architecture.md §2 — MEDIA_STORAGE_DRIVER=local in dev)
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      // Same dev machine, reached via its LAN IP instead of localhost — needed so the site
      // still renders images when opened from another device (e.g. a phone) on the same Wi-Fi.
      { protocol: "http", hostname: "192.168.88.207", port: "4000", pathname: "/uploads/**" },
      // Temporary public tunnel (Cloudflare quick tunnel) fronting the API — changes every
      // restart, see the allowedDevOrigins comment above.
      { protocol: "https", hostname: "strip-wings-stage-expressed.trycloudflare.com", pathname: "/uploads/**" },
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
    // TEMPORARY, while previewing over a tunnel: keeps the image pipeline to one fewer moving
    // part (no extra server-side re-fetch/resize hop through the tunnel). Safe to remove once
    // no longer tunneling.
    unoptimized: true,
  },
};

export default nextConfig;
