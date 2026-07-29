import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("physiotherapy");
export const metadata: Metadata = guideMetadata(guide.slug);

const patterns = [
  {
    name: "Courses of treatment, not one-off visits",
    body: "Most physiotherapy is a series — six sessions over three weeks — rather than a single appointment. The scheduling unit is still the day, but the caseload each day is drawn from many overlapping courses at different stages.",
  },
  {
    name: "Mixed clinic and community days",
    body: "Many teams run clinic in the morning and home visits in the afternoon. Model the clinic block by narrowing that physiotherapist's working hours to the community part of the day.",
  },
  {
    name: "Early supported discharge",
    body: "Post-stroke and post-surgical pathways often require daily visits with a genuine minimum gap between them, and are time-sensitive in a way routine musculoskeletal work is not.",
  },
  {
    name: "Falls prevention and rehab at home",
    body: "Longer sessions involving exercise programmes, often with equipment. Duration varies more than in clinic work, which makes accurate per-visit durations worth the effort.",
  },
  {
    name: "Joint visits with OT",
    body: "Common in reablement and discharge planning. Where both professionals are on your staff list, set staff required to 2 so they are scheduled together.",
  },
];

const faqs = [
  {
    q: "Can it schedule a course of treatment across several weeks?",
    a: "Schedules are generated a day at a time, so a course is planned as the days come rather than booked out in one action. In practice this suits community rehab, where progress determines whether the next session is needed and staff availability changes week to week.",
  },
  {
    q: "How do I handle daily visits with a required gap?",
    a: "For a patient needing more than one contact in the same day, set visits required and a minimum gap so the sessions cannot be scheduled too close together. Across separate days, simply enter the visit on each day it is due.",
  },
  {
    q: "How do I model a physiotherapist who does clinic in the morning?",
    a: "Narrow their working hours to the community portion of the day — for example 13:00 to 17:00. The scheduler then plans only within the time genuinely available for visits, and will not assume they can be out on the road during clinic.",
  },
  {
    q: "Can I keep specialist caseloads with the right therapists?",
    a: "Yes, using skills. Respiratory, neuro, paediatric, vestibular and musculoskeletal specialisms can each be recorded as a skill and required on the relevant visits, so those patients are only allocated to therapists competent in that area.",
  },
  {
    q: "Some patients can only be seen after work. How do I handle that?",
    a: "Create a call purpose with a late window — for example 16:30 to 19:00 — and tag those patients' visits with it. Combined with a physiotherapist whose working hours extend into the evening, the scheduler will build the late round for you rather than you carving it out by hand.",
  },
  {
    q: "Does it track exercise programmes or outcome measures?",
    a: "No. GeoRoutes plans who is visited, when, and in what order. Clinical content, outcome measures and treatment notes stay in whatever record system you already use.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Community physiotherapy sits between the two extremes: more visits than an occupational therapy caseload, shorter than an assessment round, and complicated by therapists who split their week between clinic and the community."
    >
      <Section title="How rehab caseloads behave">
        <FieldList fields={patterns} />
      </Section>

      <Section title="The clinic and community split">
        <p>
          The most common setup problem in physiotherapy teams is trying to
          model a mixed day as a single block of availability. If a
          physiotherapist is in clinic until one o&apos;clock, their working
          hours for scheduling purposes start at one o&apos;clock — not at nine
          with a hopeful gap in the middle.
        </p>
        <p>
          Setting hours this way means the scheduler is planning against real
          availability. It will fit fewer visits, but they will be visits that
          can actually happen, and the round will not silently assume someone
          can be across town during a clinic slot.
        </p>
        <Callout title="Why this matters more than it sounds">
          A schedule built on overstated availability does not fail loudly. It
          produces a plausible-looking plan that runs late from the first
          afternoon visit onwards, and the cause is invisible in the output
          because nothing about it was technically invalid.
        </Callout>
      </Section>

      <Section title="Getting more out of a rehab round">
        <p>
          Physiotherapy visits vary in length more than most people allow for. A
          first assessment, a progression session and a discharge review are
          rarely the same duration, and averaging them across the caseload is
          the usual reason an afternoon overruns.
        </p>
        <p>
          Where patients have genuine timing needs — working-age patients who
          can only be seen in the evening, or early supported discharge patients
          who need a morning session — express those as purposes with windows
          rather than fixed times. The guides on{" "}
          <Link href="/help/time-windows" className="text-teal-400 hover:text-teal-300">
            time windows
          </Link>{" "}
          and{" "}
          <Link href="/help/reading-your-schedule" className="text-teal-400 hover:text-teal-300">
            reading your schedule
          </Link>{" "}
          cover how to set those up and how to tell whether they are what is
          constraining your day.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
