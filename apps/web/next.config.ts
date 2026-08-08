import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ppn/ui-components"],
  images: {
    remotePatterns: [
      // Local media storage (docs/06-architecture.md §2 — MEDIA_STORAGE_DRIVER=local in dev)
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
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
