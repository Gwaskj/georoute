import type { Metadata } from "next";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("reading-your-schedule");
export const metadata: Metadata = guideMetadata(guide.slug);

const outputs = [
  {
    name: "The schedule table",
    body: "Every visit in time order, grouped by the staff member doing it, with a start and end time for each. This is the part you would print or read out at handover.",
  },
  {
    name: "The map",
    body: "Each staff member's route drawn in their own colour, with a pin at every stop. Following one colour shows you one person's day as an actual journey, which makes an inefficient ordering obvious in a way a table does not.",
  },
  {
    name: "Staff summary",
    body: "Per-person totals for the day — how many visits, and how the time splits between visiting and travelling. This is the quickest way to see whether work is spread evenly across the team.",
  },
  {
    name: "Warnings",
    body: "Anything that could not be scheduled, and why. A warning names the specific visit rather than reporting a general failure, so you can go straight to the constraint that caused it.",
  },
  {
    name: "Hints",
    body: "Observations that are not failures — places where a small change would have allowed a better plan. Worth reading when a schedule is valid but looks heavier than you expected.",
  },
];

const faqs = [
  {
    q: "A visit is missing from the schedule. Where did it go?",
    a: "Nothing is dropped silently. If a visit is not in the table it will be named in the warnings, along with the reason it could not be placed — most often a time window it could not fit inside, a skill nobody available holds, or a double-up where two staff could not be freed at once.",
  },
  {
    q: "Why does a route double back on itself?",
    a: "Almost always because of a timing constraint rather than a routing mistake. If a visit has a window or a strict start time, the scheduler has to be at that address at that time even if the geography would prefer otherwise. Removing the constraint and regenerating will show you whether it was the cause.",
  },
  {
    q: "The travel times look longer than I would expect. Why?",
    a: "They are real road distances rather than straight-line estimates, so they account for the route actually being driven. Urban journeys in particular are often much slower per mile than people estimate. They do not model live traffic, so treat them as typical driving times rather than a prediction for a specific morning.",
  },
  {
    q: "One person has far more visits than another. Is that a bug?",
    a: "Usually not. The scheduler optimises the round as a whole rather than balancing headcount, so someone whose start location sits in a dense cluster will legitimately take more visits than a colleague covering a rural spread. If you need a more even split, narrowing the busier person's working hours is the usual lever.",
  },
  {
    q: "Can I save or share the schedule?",
    a: "A generated schedule is kept in your browser, so it is still there when you come back. To send a carer their round, use Share with staff — it produces a read-only link that works without an account, with the visits carried inside the link rather than stored anywhere. Send a fresh link each day, as an old one cannot be withdrawn.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="A generated schedule is four things at once: a timed plan, a set of routes, a workload summary, and a list of what the scheduler could not do. The last of those is the one worth reading first."
    >
      <Section title="What you get back">
        <FieldList fields={outputs} />
      </Section>

      <Section title="Read the warnings first">
        <p>
          It is tempting to look at the table and assume the day is planned. The
          warnings are what tell you whether the plan is complete. A schedule
          with three unplaceable visits still produces a perfectly readable
          table for everything else, and the difference matters before you send
          it out.
        </p>
        <p>
          Warnings name the visit and the reason, which is usually enough to fix
          in one edit. In most cases a single constraint is doing the damage —
          one strict start time, or one skill requirement — rather than the
          round being genuinely over capacity.
        </p>
        <Callout title="A quick diagnostic">
          If you are not sure whether a day is over capacity or just
          over-constrained, relax the tightest constraint and regenerate. If
          everything places, it was constraints. If visits still fail, you are
          short of hours and no amount of rearranging will fix it.
        </Callout>
      </Section>

      <Section title="Using the map to sanity-check">
        <p>
          The map is the fastest way to spot a plan that is technically valid
          but practically awkward. Following a single colour from start to
          finish shows the day as a journey, and a route that crosses itself
          repeatedly usually points at a timing constraint pulling someone back
          across the patch.
        </p>
        <p>
          It is also the easiest way to see whether your start locations are
          sensible. If someone&apos;s first leg is a long drive across
          everybody else&apos;s territory, switching them between home and
          office start — or swapping which visits they are eligible for — is
          often worth more than any other change.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
