import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { GUIDES, guidePath } from "@/lib/help/guides";

// Only publicly useful, indexable pages belong here. Account, settings, staff
// and admin are user-specific and are disallowed in robots.ts instead -- listing
// them would invite Google to crawl pages it can only ever see logged out.
/**
 * Dates are written out rather than taken from `new Date()` at build time.
 *
 * Every URL previously carried the build timestamp, so each deploy told Google
 * all eighteen pages had changed at the same instant -- including ones
 * untouched for weeks. Google discounts lastmod when it looks unreliable, so
 * the field was earning nothing. Reading git at build time does not fix it
 * either: Vercel builds from a shallow clone, where `git log -1 -- <file>`
 * reports the current commit for every file.
 *
 * Bump the date when a page's content genuinely changes. A date that stays put
 * while a page is untouched is the accurate answer, not a stale one.
 */
const PAGE_UPDATED: Record<string, string> = {
  "/": "2026-08-20",
  "/how-it-works": "2026-08-20",
  "/help": "2026-08-20",
  "/pricing": "2026-08-20",
  "/privacy": "2026-08-20",
  "/terms": "2026-08-20",
  "/security": "2026-08-20",
  "/accessibility": "2026-08-20",
};

// Noon UTC so a date cannot land on the wrong day once serialised through a
// timezone offset -- the same reason the recurrence maths uses midday.
function asDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
    { path: "/help", changeFrequency: "monthly", priority: 0.8 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    // /login and /signup are deliberately absent: nobody searches for them,
    // they carry ~60 words each, and listing thin utility pages dilutes the
    // sitemap. They stay crawlable, just not advertised.
    //
    // /scheduler is absent for the same reason, despite being the product.
    // It was listed at priority 0.9 -- the second highest on the site -- and
    // renders about 107 words, because it is an application screen rather
    // than something to read. Anyone working down the sitemap, reviewer or
    // crawler, went from the home page straight to a near-empty screen.
    //
    // /feedback is absent because it is 61 words wrapping an embedded Google
    // Form: content from a third party with nothing added around it.
    // Security is listed above the other policy pages on purpose. "Is our data
    // safe" is the first question a care provider asks, and the answer here is
    // the product's strongest argument rather than boilerplate.
    { path: "/security", changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
    { path: "/accessibility", changeFrequency: "yearly", priority: 0.2 },
  ];

  // Generated from the guide registry so a new guide appears in the sitemap
  // automatically -- the sitemap cannot fall behind the pages that exist.
  // Sector pages outrank the how-to guides. They now sit at the top level and
  // are the pages someone lands on while choosing software, so they carry more
  // commercial weight than an article about configuring time windows.
  const guides = GUIDES.map((g) => ({
    path: guidePath(g),
    changeFrequency: "monthly" as const,
    priority: g.category === "sector" ? 0.9 : 0.7,
    updated: g.updated,
  }));

  return [
    ...pages.map((p) => ({ ...p, updated: PAGE_UPDATED[p.path] })),
    ...guides,
  ].map(({ path, changeFrequency, priority, updated }) => ({
    url: `${SITE_URL}${path}`,
    // A missing entry would silently fall back to "now" and reintroduce the
    // problem for that one URL, so it is better to have no lastmod at all.
    ...(updated ? { lastModified: asDate(updated) } : {}),
    changeFrequency,
    priority,
  }));
}
