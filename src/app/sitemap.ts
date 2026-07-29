import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { GUIDES } from "@/lib/help/guides";

// Only publicly useful, indexable pages belong here. Account, settings, staff
// and admin are user-specific and are disallowed in robots.ts instead -- listing
// them would invite Google to crawl pages it can only ever see logged out.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    // The scheduler itself is usable without an account, so it is a genuine
    // entry point rather than an app screen behind a login.
    { path: "/scheduler", changeFrequency: "weekly", priority: 0.9 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
    { path: "/help", changeFrequency: "monthly", priority: 0.8 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/signup", changeFrequency: "monthly", priority: 0.5 },
    { path: "/login", changeFrequency: "yearly", priority: 0.4 },
    { path: "/feedback", changeFrequency: "monthly", priority: 0.3 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  ];

  // Generated from the guide registry so a new guide appears in the sitemap
  // automatically -- the sitemap cannot fall behind the pages that exist.
  const guides = GUIDES.map((g) => ({
    path: `/help/${g.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...pages, ...guides].map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
