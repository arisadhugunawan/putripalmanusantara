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
  },
};

export default nextConfig;
