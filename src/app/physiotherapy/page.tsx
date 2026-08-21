import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, Steps, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
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

const dailyRoutine = [
  {
    title: "Work from the course of treatment, not single visits",
    body: "Rehab is a block of visits over weeks, not a one-off. Set each patient up as a recurring pattern for the length of their course — twice a week for six weeks — so the whole programme exists as one thing rather than being rebooked from memory every Friday. That is also what makes it obvious when a course has quietly run past its end date.",
  },
  {
    title: "Split the day between community and clinic honestly",
    body: "Most community physio services run both. Decide which parts of the day are home visits and set working hours to match, rather than scheduling across the whole day and hoping the clinic block survives. A home visit booked into what was meant to be clinic time is the disruption that costs the most, because it displaces several patients rather than one.",
  },
  {
    title: "Set duration by treatment type",
    body: "An initial assessment, a progress review and a routine treatment session are different lengths, and averaging them produces a day that is wrong in both directions. Enter each visit at its real length including setting up equipment and writing notes — the first visit in a course is almost always the longest.",
  },
  {
    title: "Cluster the patch, then generate",
    body: "Where a patient is seen twice a week, which two days is usually flexible. Use that flexibility to put patients in the same area on the same day. Over a six-week course this compounds into a large amount of travel saved, and it is far easier to arrange at the start of a course than halfway through.",
  },
  {
    title: "Read the warnings, then look at the route",
    body: "Warnings name the visits that could not be placed and why. After that, look at the map: a rehab round that crosses the patch twice usually means two patients are pinned to times that only need windows. Physio appointments are more movable than most community visits, so this is often quick to fix.",
  },
  {
    title: "Review progress against the plan weekly",
    body: "At the end of each week, check which courses are ending, which need extending and which patients have been discharged. Ending a recurrence when a course finishes is the difference between a caseload that reflects reality and one that slowly fills with people who no longer need visiting.",
  },
];

const disruptions = [
  {
    name: "A patient cancels on the day",
    body: "Skip that occurrence rather than deleting the pattern, so the rest of the course stays intact. If the gap is large enough to be useful, regenerate — the scheduler will often pull another visit forward into the space rather than leaving the therapist idle between two ends of the patch.",
  },
  {
    name: "A course needs extending",
    body: "Extend the recurrence end date rather than adding individual visits on the end. Added one at a time they lose the pattern, and the next person to look at the caseload cannot tell how much of the course is left.",
  },
  {
    name: "Clinic sessions keep being eaten by home visits",
    body: "This is a working-hours problem rather than a scheduling one. Set the therapist's community hours to exclude clinic blocks so the scheduler cannot place a home visit there. Protecting the time in the input is more reliable than protecting it by intention.",
  },
  {
    name: "Travel is disproportionate to contact time",
    body: "Common in rural patches with long courses. Look at whether the two days a week each patient is seen can be aligned by area rather than by referral date. If travel still dominates, the honest question is whether some of the course could be delivered in clinic or remotely.",
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

      <Section title="Running a physio caseload day to day">
        <p>
          A rehab caseload is a set of overlapping courses rather than a list of
          appointments, and the routine reflects that: most of the useful
          decisions are made when a course starts, not on the morning of a
          visit.
        </p>
        <Steps steps={dailyRoutine} />
        <Callout title="Set the course up once, properly">
          The single biggest time saving in a physio service is entering a
          course of treatment as a recurring pattern with an end date, rather
          than rebooking each patient every week. It also stops courses running
          on past their intended length without anyone noticing.
        </Callout>
      </Section>

      <Section title="When a course does not run to plan">
        <p>
          Courses get cancelled, extended and interrupted. Handling each in a
          way that keeps the pattern intact is what keeps the caseload honest.
        </p>
        <FieldList fields={disruptions} />
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
          <Link href="/help/time-windows" className="text-teal-400 underline hover:text-teal-300">
            time windows
          </Link>{" "}
          and{" "}
          <Link href="/help/reading-your-schedule" className="text-teal-400 underline hover:text-teal-300">
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
