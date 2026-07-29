import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/update-password",
          "/reset-password",
          // Signed-in pages. Crawling these only ever yields a logged-out
          // shell, which reads as thin or duplicate content in Search Console.
          "/account",
          "/settings",
          "/staff",
          // Shared rounds contain client names and addresses. The pages are
          // also noindex, but keeping crawlers out entirely is the stronger
          // guarantee since links get pasted into chat apps that pre-fetch.
          "/r/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
