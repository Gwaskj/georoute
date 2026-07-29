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
  },
  {
    slug: "staff-and-skills",
    title: "Staff, skills and start locations",
    metaTitle: "Managing Staff, Skills and Start Locations",
    description:
      "How to add staff, set individual working hours, choose whether someone starts from home or the office, and use skills so visits only go to people qualified to do them.",
    category: "basics",
    minutes: 7,
  },
  {
    slug: "appointments-and-visits",
    title: "Appointments, double-ups and repeat visits",
    metaTitle: "Appointments, Double-Up Calls and Repeat Visits",
    description:
      "How to add appointments, request two staff for a double-up, schedule several visits to the same person in one day, and enforce a minimum gap between them.",
    category: "basics",
    minutes: 8,
  },
  {
    slug: "time-windows",
    title: "Call purposes and time windows",
    metaTitle: "Call Purposes and Custom Time Windows",
    description:
      "How to keep morning calls in the morning, pin time-critical visits to an exact time, and use call purposes and custom windows to control when each type of visit is scheduled.",
    category: "basics",
    minutes: 7,
  },
  {
    slug: "reading-your-schedule",
    title: "Reading your schedule, map and warnings",
    metaTitle: "Reading Your Schedule, Map and Warnings",
    description:
      "How to interpret the generated schedule, follow each staff member's route on the map, and act on the warnings and hints the scheduler produces.",
    category: "basics",
    minutes: 6,
  },
  {
    slug: "care-planning",
    title: "Care planning and domiciliary call rounds",
    metaTitle: "Care Planning Software for Domiciliary Call Rounds",
    description:
      "Using GeoRoutes as care planning software for home care: building morning, lunch, tea and bed call rounds, handling double-up calls, and keeping continuity of carer.",
    category: "sector",
    minutes: 9,
  },
  {
    slug: "community-nursing",
    title: "Community and district nursing visits",
    metaTitle: "Community Nurse Scheduling and Visit Planning",
    description:
      "A scheduling guide for district and community nursing teams: insulin and medication rounds with strict times, clinical skill matching, and caseloads that change daily.",
    category: "sector",
    minutes: 9,
  },
  {
    slug: "occupational-therapy",
    title: "Occupational therapy caseloads",
    metaTitle: "Occupational Therapy Scheduling Software",
    description:
      "How occupational therapy teams plan long assessment visits, equipment reviews and joint visits, where travel is a large share of a day with few appointments in it.",
    category: "sector",
    minutes: 8,
  },
  {
    slug: "physiotherapy",
    title: "Community physiotherapy rounds",
    metaTitle: "Physiotherapy Scheduling for Community Teams",
    description:
      "Scheduling community physiotherapy and rehab: treatment blocks, repeat visits across a course of treatment, and balancing home visits against clinic sessions.",
    category: "sector",
    minutes: 8,
  },
];

export const BASICS = GUIDES.filter((g) => g.category === "basics");
export const SECTORS = GUIDES.filter((g) => g.category === "sector");

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
    alternates: { canonical: `/help/${guide.slug}` },
  };
}
