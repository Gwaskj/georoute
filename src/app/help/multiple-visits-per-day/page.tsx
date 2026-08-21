import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("multiple-visits-per-day");
export const metadata: Metadata = guideMetadata(guide.slug);

const settings = [
  {
    name: "Visits required",
    body: "How many separate visits this person needs that day. Set it to 4 for someone on morning, lunch, tea and bed calls, and the scheduler places four rather than one. Left at 1, the appointment behaves like any ordinary single visit.",
  },
  {
    name: "Minimum gap",
    body: "The least time that must pass between one visit to this person and the next. This is what stops four calls being stacked into one convenient afternoon — efficient on paper, useless in practice.",
  },
  {
    name: "Call purpose",
    body: "Which part of the day a visit belongs to. Tagging visits as morning, lunch, tea and bed calls keeps each one in its own window without pinning any of them to an exact time.",
  },
  {
    name: "Duration",
    body: "Set per visit, not averaged across the package. A 45-minute morning call and a 20-minute tea call are different jobs, and averaging them is the usual reason an afternoon overruns.",
  },
  {
    name: "Staff required",
    body: "Two, where a visit needs two people. A package often needs a double-up at the morning and bed calls but not the ones in between, and each visit is set separately.",
  },
];

const faqs = [
  {
    q: "Can it schedule several visits a day to the same client?",
    a: "Yes. Set visits required to the number of calls that person needs and give a minimum gap so they cannot bunch together. The scheduler places each one separately, routes between them like any other visit, and keeps them spaced by at least the gap you set. Four calls a day to one address is the case this was built around.",
  },
  {
    q: "How do I stop the visits being scheduled back to back?",
    a: "The minimum gap does that. Without one, nothing prevents a lunch call being scheduled twenty minutes after the morning call, because that ordering genuinely produces less travel. The gap is what tells the scheduler that spacing matters more than efficiency here.",
  },
  {
    q: "What if the calls also need to fall at particular times of day?",
    a: "Use call purposes as well as the gap. The gap controls spacing relative to the previous visit; a purpose controls which part of the clock a visit can occupy. Most repeat-visit rounds need both — a window to keep the bed call in the evening, and a gap so it cannot land an hour after the tea call.",
  },
  {
    q: "Do I have to use repeat visits at all?",
    a: "No. Visits required defaults to 1, which is an ordinary single appointment, and the minimum gap then has nothing to apply to. Teams doing one visit per client per day never touch either field. The scheduler is a general route planner first; repeat visits are one capability among several.",
  },
  {
    q: "Can different clients have different numbers of visits?",
    a: "Yes, it is set per client. A round can mix someone on four calls a day, someone on two, and a dozen people on one, and the scheduler will interleave them all into the same staff timetable.",
  },
  {
    q: "Does each visit have to be the same length or need the same staff?",
    a: "No. Duration and staff required are set per visit, so a package can have a 45-minute double-up in the morning and a 20-minute single call at teatime.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Visiting the same person several times in one day is the thing most scheduling tools cannot express. This covers how to set it up, why the gap matters as much as the count, and how to run the same scheduler without repeat visits at all."
    >
      <Section title="Why this is the awkward case">
        <p>
          Most route planners assume one stop per destination. Give them a list
          of addresses and they will find a good order to drive them in — but
          ask for the same address four times, spaced through the day, and the
          model breaks down. The efficient answer is to do all four while you
          are there, which is exactly what nobody wants.
        </p>
        <p>
          That pattern is normal in home care, and common in reablement,
          post-discharge support and any service working to a call schedule. A
          person needing help to get up, to eat, and to get to bed needs three
          or four separate visits at sensible intervals, from staff who are
          driving between other people in between.
        </p>
      </Section>

      <Section title="How to set it up">
        <p>
          Repeat visits are described on the appointment itself rather than by
          entering the same person several times. Five fields do the work.
        </p>
        <FieldList fields={settings} />
        <Callout title="The gap is the important half">
          The count alone gets you four visits; without a gap they can legally
          all fall inside an hour. Set the gap to the shortest interval that is
          genuinely acceptable — three hours between calls is a common starting
          point — and let the windows handle the rest.
        </Callout>
      </Section>

      <Section title="A worked example">
        <p>
          Say a client needs four calls: 45 minutes in the morning with two
          carers, 30 minutes at lunch, 30 at teatime and 30 at bedtime, no
          closer than three hours apart.
        </p>
        <p>
          Visits required becomes 4. The minimum gap becomes 180 minutes.
          Duration is set per visit rather than averaged. Staff required is 2 on
          the morning call only. Each call is tagged with the purpose that
          matches its part of the day, so the morning call cannot drift into the
          afternoon.
        </p>
        <p>
          Nothing in that describes an order or a clock time. The scheduler
          works those out, fitting the four calls around every other client on
          the round and around the staff member&apos;s own hours and breaks.
        </p>
      </Section>

      <Section title="Running it without repeat visits">
        <p>
          None of this is compulsory. Visits required defaults to 1 — an
          ordinary appointment, visited once — and the minimum gap then has
          nothing to apply to. A service doing one visit per person per day
          never touches either field, and the scheduler behaves as a
          straightforward route planner.
        </p>
        <p>
          That matters because the same tool covers both. An occupational
          therapy team doing four long assessments a day and a home care service
          doing sixty short calls are running the same scheduler with different
          fields filled in. Mixed rounds work too: one client on four calls
          alongside twenty on one is a normal day, not a special case.
        </p>
        <p>
          The field-by-field reference is in{" "}
          <Link
            href="/help/appointments-and-visits"
            className="text-teal-400 underline hover:text-teal-300"
          >
            appointments, double-ups and repeat visits
          </Link>
          , and{" "}
          <Link href="/help/time-windows" className="text-teal-400 underline hover:text-teal-300">
            call purposes and time windows
          </Link>{" "}
          covers keeping each call in the right part of the day.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
