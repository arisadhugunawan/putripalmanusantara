import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** docs/06-architecture.md §7 — disallow /admin, reference the dynamic sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
