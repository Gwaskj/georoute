// Single source of truth for the help section.
//
// The hub page, the sitemap, and the cross-links at the foot of each guide all
// read from here, so a new guide only has to be added once. Keeping the slug
// list in one place is what stops the sitemap drifting out of step with the
// pages that actually exist.

export type GuideCategory = "basics" | "sector";

export interface Guide {
  slug: string;
  /** <h1> and link text. */
  title: string;
  /** <title> tag. Kept distinct from the h1 so it can carry search context. */
  metaTitle: string;
  /** Meta description and the summary shown on the hub page. */
  description: string;
  category: GuideCategory;
  /** Rough read time, shown on the hub so people can triage. */
  minutes: number;
  /**
   * Date this guide's content last genuinely changed, as YYYY-MM-DD. Feeds
   * lastmod in the sitemap.
   *
   * Written out rather than derived from git: Vercel builds from a shallow
   * clone, so `git log -1 -- <file>` at build time reports the current commit
   * for every file and would recreate the problem this replaces -- one
   * identical timestamp claiming all eighteen pages changed on every deploy.
   * Google discounts lastmod entirely when it looks unreliable, so a date that
   * stays put while a page is untouched is worth more than a fresh one.
   *
   * Bump it when the content changes. Leaving it alone for a typo fix is the
   * right call.
   */
  updated: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "getting-started",
    title: "Getting started: your first schedule",
    metaTitle: "Getting Started – Build Your First Schedule",
    description:
      "A step-by-step walkthrough for building your first optimised schedule in GeoRoutes, from adding staff to reading the finished route.",
    category: "basics",
    minutes: 6,
    updated: "2026-07-29",
  },
  {
    slug: "staff-and-skills",
    title: "Staff, skills and start locations",
    metaTitle: "Managing Staff, Skills and Start Locations",
    description:
      "Add staff, set individual working hours, choose whether someone starts from home or the office, and use skills so visits reach qualified people only.",
    category: "basics",
    minutes: 7,
    updated: "2026-07-29",
  },
  {
    slug: "appointments-and-visits",
    title: "Appointments, double-ups and repeat visits",
    metaTitle: "Appointments, Double-Up Calls and Repeat Visits",
    description:
      "How to add appointments, request two staff for a double-up, schedule several visits to the same person in one day, and enforce a minimum gap between them.",
    category: "basics",
    minutes: 8,
    updated: "2026-07-29",
  },
  {
    slug: "multiple-visits-per-day",
    title: "Multiple visits a day to the same person",
    metaTitle: "Multiple Visits Per Day to the Same Client",
    description:
      "Schedule several visits a day to one person with a minimum gap between them — morning, lunch, tea and bed calls — or run without repeat visits at all.",
    category: "basics",
    minutes: 8,
    updated: "2026-08-04",
  },
  {
    slug: "time-windows",
    title: "Call purposes and time windows",
    metaTitle: "Call Purposes and Custom Time Windows",
    description:
      "Keep morning calls in the morning, pin time-critical visits to an exact time, and use call purposes and custom windows to control when visits happen.",
    category: "basics",
    minutes: 7,
    updated: "2026-07-29",
  },
  {
    slug: "reading-your-schedule",
    title: "Reading your schedule, map and warnings",
    metaTitle: "Reading Your Schedule, Map and Warnings",
    description:
      "How to interpret the generated schedule, follow each staff member's route on the map, and act on the warnings and hints the scheduler produces.",
    category: "basics",
    minutes: 6,
    updated: "2026-07-29",
  },
  {
    slug: "care-planning",
    title: "Care planning and domiciliary call rounds",
    metaTitle: "Care Planning Software for Home Care Rounds",
    description:
      "Care planning software for home care: building morning, lunch, tea and bed call rounds, handling double-up calls, and keeping continuity of carer.",
    category: "sector",
    minutes: 9,
    updated: "2026-08-09",
  },
  {
    slug: "community-nursing",
    title: "Community and district nursing visits",
    metaTitle: "Community Nurse Scheduling and Visit Planning",
    description:
      "Scheduling for district and community nursing: insulin and medication rounds with strict times, clinical skill matching, and caseloads that change daily.",
    category: "sector",
    minutes: 9,
    updated: "2026-08-09",
  },
  {
    slug: "occupational-therapy",
    title: "Occupational therapy caseloads",
    metaTitle: "Occupational Therapy Scheduling Software",
    description:
      "How occupational therapy teams plan long assessment visits, equipment reviews and joint visits, where travel dominates a day with few appointments.",
    category: "sector",
    minutes: 8,
    updated: "2026-08-09",
  },
  {
    slug: "physiotherapy",
    title: "Community physiotherapy rounds",
    metaTitle: "Physiotherapy Scheduling for Community Teams",
    description:
      "Scheduling community physiotherapy and rehab: treatment blocks, repeat visits across a course of treatment, and balancing home visits against clinic sessions.",
    category: "sector",
    minutes: 8,
    updated: "2026-08-09",
  },
];

export const BASICS = GUIDES.filter((g) => g.category === "basics");
export const SECTORS = GUIDES.filter((g) => g.category === "sector");

/**
 * Where a guide lives.
 *
 * The two categories are different kinds of page and belong at different
 * depths. The basics are documentation: someone reads them after signing up,
 * with a problem in front of them, and /help is exactly where they expect to
 * find them.
 *
 * The sector pages are not documentation at all. "Care planning software for
 * home care rounds" is what someone types while deciding which product to buy,
 * and they land on it having never heard of us. Serving that from /help told
 * both the reader and Google it was a support article -- the wrong signal for
 * the page carrying the most commercial intent on the site.
 *
 * Defined here rather than written out at each call site, because the sitemap,
 * the breadcrumbs, the cross-links and the canonical tag all have to agree, and
 * a path that disagrees with the canonical is worse than one that is merely
 * ugly.
 */
export function guidePath(guide: Guide): string {
  return guide.category === "sector" ? `/${guide.slug}` : `/help/${guide.slug}`;
}

export function getGuide(slug: string): Guide {
  const guide = GUIDES.find((g) => g.slug === slug);
  // Thrown at build time, not runtime: a typo'd slug fails `next build` rather
  // than shipping a page with an empty title.
  if (!guide) throw new Error(`Unknown help guide slug: ${slug}`);
  return guide;
}

/**
 * Metadata for a guide page. Titles are deliberately bare -- the root layout
 * applies the "%s – GeoRoutes" template, so including the suffix here would
 * double it.
 */
export function guideMetadata(slug: string) {
  const guide = getGuide(slug);
  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical: guidePath(guide) },
  };
}
