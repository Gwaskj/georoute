import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, Steps, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("getting-started");
export const metadata: Metadata = guideMetadata(guide.slug);

const steps = [
  {
    title: "Add the people doing the visiting",
    body: "Open the scheduler and add each staff member with their name and the postcode they set off from. If someone starts at home rather than the office, set their start location to home — it changes where the scheduler thinks their first journey begins, which often changes the whole shape of their day.",
  },
  {
    title: "Set working hours",
    body: "Give each person a start and end time. These are per-person, so a part-time worker finishing at 13:00 and a full-time colleague finishing at 17:00 can sit in the same run. Nothing will be scheduled outside someone's own hours.",
  },
  {
    title: "Add the visits",
    body: "Add each person to be visited with their postcode and how long the visit takes. Duration matters more than people expect: it is the single biggest driver of how many visits fit in a day, and guessing it low is the usual reason a schedule looks achievable on screen but not in practice.",
  },
  {
    title: "Set the day window",
    body: "Choose the earliest and latest times the working day can run between. This is the outer boundary for everyone. Individual working hours narrow it further per person, and time windows narrow it further per visit.",
  },
  {
    title: "Generate",
    body: "Press Generate. The scheduler assigns every visit to a staff member, orders them to keep driving down, and returns a timed plan. It uses real road distances rather than straight-line estimates, so the travel gaps between visits reflect actual routes.",
  },
  {
    title: "Read the warnings before the schedule",
    body: "If anything could not be placed, it is reported as a warning rather than silently dropped. Read those first — they tell you whether the plan is complete, and usually point at one visit with an impossible constraint rather than a problem with the whole round.",
  },
];

const faqs = [
  {
    q: "Do I need an account to try it?",
    a: "No. Free mode runs entirely in your browser session and needs no sign-up. You can add up to 2 staff and 10 appointments to see how it behaves on your own postcodes. Creating a Pro account raises that to unlimited staff and up to 100 appointments a day, and saves your data to the cloud so it is there next time.",
  },
  {
    q: "What happens to my data in free mode?",
    a: "It stays in your browser's session storage and is never sent to our servers. Closing the tab clears it. That also means free mode cannot carry a round over from one day to the next — for that you need a Pro account.",
  },
  {
    q: "Do I have to enter full addresses?",
    a: "No. A UK postcode is enough to place a visit and calculate travel. You can add a house name or number and a fuller address for the benefit of whoever is doing the visit, but the scheduling itself works from the postcode.",
  },
  {
    q: "How long does a schedule take to generate?",
    a: "Seconds, for a normal day's round. The slowest part is looking up travel times between postcodes the first time they are used; repeated postcodes are cached, so re-running a round you have already built is faster than the first attempt.",
  },
  {
    q: "Can I change a schedule after it is generated?",
    a: "Yes. Adjust the inputs — a duration, a time window, someone's hours — and generate again. The scheduler is quick enough that trying two or three variants of a difficult day is practical, which is usually more productive than hand-editing a result.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="This walks through building a schedule from an empty screen to a finished plan. It takes about ten minutes with a real round in front of you, and you do not need an account to follow along."
    >
      <Section title="Before you start">
        <p>
          Have a real round to hand rather than test data — a day you have
          already planned by hand works best, because you can compare the
          result against what you would have done yourself. You will need the
          postcodes you visit, roughly how long each visit takes, and the hours
          your staff work.
        </p>
        <Callout title="Worth knowing">
          Everything here works in free mode, so you can test it against a real
          day before deciding whether the tool is any use to you. Free mode is
          capped at 2 staff and 10 appointments, which is enough to check the
          behaviour on a genuine round.
        </Callout>
      </Section>

      <Section title="Building your first schedule">
        <Steps steps={steps} />
      </Section>

      <Section title="Getting a realistic result">
        <p>
          The most common cause of a schedule that looks wrong is a visit
          duration that has been rounded down. If a visit that really takes 45
          minutes is entered as 30, the error compounds across the day, and a
          round that appears to fit will run late by mid-afternoon. It is worth
          timing a few real visits before trusting a plan.
        </p>
        <p>
          The second most common cause is travel expectations. The scheduler
          uses real road distances, so a visit two miles away across a town
          centre may cost more time than one five miles down a main road. If a
          route looks like it doubles back, it is usually because the
          alternative ordering breaks a time window somewhere else in the day.
        </p>
        <p>
          Once the basics are working, the guides on{" "}
          <Link href="/help/time-windows" className="text-teal-400 hover:text-teal-300">
            call purposes and time windows
          </Link>{" "}
          and{" "}
          <Link href="/help/appointments-and-visits" className="text-teal-400 hover:text-teal-300">
            double-ups and repeat visits
          </Link>{" "}
          cover the constraints that make real rounds harder than a simple list
          of stops.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
