import Link from "next/link";

/**
 * "What do you do?" — routes a visitor to the guide written for their service.
 *
 * This exists as much for crawling as for people. Search Console had the four
 * sector guides sitting at "Discovered – currently not indexed" with no crawl
 * date at all, while the one sector-style guide the home page happened to link
 * to had been crawled. They were otherwise comparable: all four are around a
 * thousand words, so depth was not what separated them. What separated them
 * was that the others were reachable only through the help hub, two clicks
 * from the highest-authority page on the site.
 *
 * So these are plain server-rendered anchors, not a picker that asks a
 * question and then routes with JavaScript. A crawler follows an href; it does
 * not answer a quiz. Every destination is an existing guide rather than a new
 * landing page written per profession -- near-identical pages competing for
 * the same queries would divide what little authority the site has, which is
 * the opposite of the problem being solved.
 */

interface Profession {
  slug: string;
  /** How someone describes their own job, not what we would call the sector. */
  role: string;
  /** The scheduling problem specific to them, in their vocabulary. */
  problem: string;
}

const PROFESSIONS: Profession[] = [
  {
    slug: "care-planning",
    role: "Home care & reablement",
    problem:
      "Morning, lunch, tea and bed calls to the same people, double-ups where two carers are needed, and continuity so clients see familiar faces.",
  },
  {
    slug: "community-nursing",
    role: "District & community nursing",
    problem:
      "Insulin and dressing visits that must land inside a clinical window, caseloads that change on the day, and visits only certain staff are signed off to do.",
  },
  {
    slug: "occupational-therapy",
    role: "Occupational therapy",
    problem:
      "Long assessment and equipment visits where four appointments can fill a day once travel is counted, plus joint visits needing two people at once.",
  },
  {
    slug: "physiotherapy",
    role: "Community physiotherapy",
    problem:
      "Treatment blocks across a course of rehab, repeat visits to the same person over weeks, and home visits balanced against clinic sessions.",
  },
];

export default function ProfessionPicker() {
  return (
    <section
      aria-labelledby="profession-heading"
      className="border-t border-slate-800 bg-slate-950"
    >
      <div className="mx-auto max-w-5xl px-4 py-16">
        <h2
          id="profession-heading"
          className="text-2xl font-semibold tracking-tight text-slate-100"
        >
          What kind of visits are you planning?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          The same scheduling problem turns up under a lot of different job
          titles, but the constraints that actually bite are different in each.
          Pick the closest to your service for a guide to setting it up the way
          your rounds actually run.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PROFESSIONS.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-5 transition hover:border-teal-500/40 hover:bg-slate-900"
              >
                <h3 className="font-semibold text-slate-100 group-hover:text-teal-300">
                  {p.role}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {p.problem}
                </p>
                <span className="mt-3 text-xs font-medium text-teal-400 group-hover:text-teal-300">
                  Read the {p.role.toLowerCase()} guide →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm leading-relaxed text-slate-400">
          Housing officers, support workers, mobile engineers and anyone else
          working from a list of addresses rather than a building use it the
          same way — start with{" "}
          <Link href="/help/getting-started" className="text-teal-400 underline hover:text-teal-300">
            building your first schedule
          </Link>
          , or read how{" "}
          <Link
            href="/help/multiple-visits-per-day"
            className="text-teal-400 underline hover:text-teal-300"
          >
            several visits a day to the same person
          </Link>{" "}
          are handled.
        </p>
      </div>
    </section>
  );
}
