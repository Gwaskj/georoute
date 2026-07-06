import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://georoute.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: new Date("2026-07-06"), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: new Date("2026-07-06"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/how-it-works`, lastModified: new Date("2026-07-06"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/feedback`, lastModified: new Date("2026-06-18"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date("2026-06-18"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date("2026-06-18"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/login`, lastModified: new Date("2026-06-18"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/signup`, lastModified: new Date("2026-06-18"), changeFrequency: "yearly", priority: 0.5 },
  ];
}
