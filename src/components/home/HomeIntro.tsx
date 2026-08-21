import Link from "next/link";

/**
 * Editorial content for the home page.
 *
 * The CMS blocks above this are marketing furniture -- short headings and
 * calls to action. This section is the substance: who the tool is for, the
 * problem it solves, and what it deliberately does not do. It is static rather
 * than CMS-driven so the page always has real content, whatever state the
 * page_content row happens to be in.
 */
export default function HomeIntro() {
  return (
    <section className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
          A multipurpose route scheduler for visits, not deliveries
        </h2>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            Most scheduling tools assume everyone turns up to the same building.
            GeoRoutes is built for the opposite: services where the work happens
            at other people&apos;s addresses, and where the time spent driving
            between them is a large part of the working day.
          </p>
          <p>
            That covers more job titles than it first appears. Home care and
            reablement services use it for morning, lunch, tea and bed call
            rounds. District and community nursing teams use it for insulin,
            dressings and other visits that have to happen inside a clinical
            window. Occupational therapy and physiotherapy services use it for
            longer assessment and rehab visits, where four appointments can
            still fill a day once travel is counted. Housing officers, support
            workers and mobile engineers face the same problem in a different
            uniform.
          </p>
        </div>

        <h3 className="mt-10 text-lg font-semibold text-slate-100">
          Several visits a day to the same person
        </h3>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            This is the case most route planners cannot express, and the one
            GeoRoutes was built around. Ordinary planners assume one stop per
            address: ask for the same address four times, spaced across the day,
            and the efficient answer becomes &ldquo;do all four while you are
            there&rdquo; — which is exactly what nobody wants.
          </p>
          <p>
            Here you say how many visits a person needs and the least time that
            must pass between them. Someone on morning, lunch, tea and bed calls
            gets four separate visits at sensible intervals, routed around every
            other client on the round. Each one can have its own length, its own
            part of the day, and its own requirement for two carers rather than
            one.
          </p>
          <p>
            None of it is compulsory. Visits required defaults to one, and a
            service doing a single visit per person never touches the setting —
            the same scheduler simply behaves as a straightforward route
            planner. Mixed rounds work too: one client on four calls alongside
            twenty on one is an ordinary day.{" "}
            <Link
              href="/help/multiple-visits-per-day"
              className="text-teal-400 underline hover:text-teal-300"
            >
              How repeat visits are set up
            </Link>{" "}
            covers it in full.
          </p>
        </div>

        <h3 className="mt-10 text-lg font-semibold text-slate-100">
          Why a spreadsheet stops working
        </h3>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            Planning a round by hand is manageable until the constraints start
            interacting. One client needs two carers at the same time. Another
            needs four separate calls a day, spaced at least three hours apart.
            A third can only be seen by someone signed off on their equipment.
            One visit has to happen at 8am because of a medication interval, and
            everything else has to fit around it.
          </p>
          <p>
            Each rule is easy on its own. Together they produce a puzzle where
            changing one visit shifts everything after it, and where the
            difference between a good ordering and a poor one is measured in
            hours of driving across a week. That is the part GeoRoutes takes
            over.
          </p>
        </div>

        <h3 className="mt-10 text-lg font-semibold text-slate-100">
          How it works
        </h3>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            You enter your staff — where they start from, the hours they work,
            any breaks they are owed, and what they are trained to do. You enter
            the visits, with a postcode, a duration and whatever rules apply:
            how many staff are needed, how many calls a day, the minimum gap
            between them, and the part of the day they belong in.
          </p>
          <p>
            The scheduler then assigns every visit to a suitable person and puts
            them in an order that keeps travel down, using real road distances
            from the OpenRouteService routing network rather than straight-line
            estimates. UK postcodes are geocoded automatically. Breaks are
            reserved before visits are placed, so a round is built around
            someone&apos;s lunch rather than lunch being squeezed into whatever
            is left.
          </p>
          <p>
            Anything that could not be scheduled is reported as a warning naming
            the specific visit, rather than quietly dropped — so you can see
            whether a day is genuinely over capacity or just over-constrained.
            The result is a timed plan per person, drawn on a map, which can be
            opened as a multi-stop route in Google Maps or Apple Maps or sent to
            staff as a read-only link.
          </p>
        </div>

        <h3 className="mt-10 text-lg font-semibold text-slate-100">
          What it is not
        </h3>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            GeoRoutes plans and routes visits. It is not a care records system:
            it holds no care plans, medication records, risk assessments or
            clinical notes, and it is not a substitute for the system your
            service uses to record what happened on a visit. Teams normally keep
            whatever records system they already have and use this to build the
            rounds those records describe.
          </p>
          <p>
            It also will not invent capacity. If a day genuinely has more work
            than hours, the scheduler will say so rather than produce a plan
            that only works on paper.
          </p>
        </div>

        <h3 className="mt-10 text-lg font-semibold text-slate-100">
          Trying it
        </h3>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            You can build a schedule without creating an account. Free mode
            supports up to 2 staff and 10 appointments and never sends your data
            to our servers — it stays in this browser, and is still here when
            you come back. That is enough to test the behaviour against a real
            day you have already planned by hand, which is the fairest
            comparison.
          </p>
          <p>
            A Pro account removes those limits and adds the calendar for
            recurring visits and future dates. It does not change where your
            data lives — that stays in your browser either way, so cancelling
            never deletes it.
          </p>
          <p>
            The{" "}
            <Link href="/help" className="text-teal-400 underline hover:text-teal-300">
              help guides
            </Link>{" "}
            walk through setting up staff and skills, double-up calls and repeat
            visits, and time windows — plus how home care, district nursing,
            occupational therapy and physiotherapy services each tend to
            configure things.{" "}
            <Link href="/how-it-works" className="text-teal-400 underline hover:text-teal-300">
              How it works
            </Link>{" "}
            covers the process end to end.
          </p>
        </div>
      </div>
    </section>
  );
}
