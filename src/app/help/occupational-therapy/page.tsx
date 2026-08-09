import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, Steps, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("occupational-therapy");
export const metadata: Metadata = guideMetadata(guide.slug);

const visitTypes = [
  {
    name: "Initial assessment",
    body: "Long — often 60 to 90 minutes, sometimes more. A day built on the assumption of 30-minute visits will be wrong by lunchtime, so enter the real duration rather than a service average.",
  },
  {
    name: "Equipment delivery or fitting",
    body: "Frequently constrained by something outside your control: a delivery slot, a contractor, or a family member needing to be present. These are the visits that most often justify a strict start time.",
  },
  {
    name: "Follow-up and review",
    body: "Shorter and far more flexible. These are the visits the scheduler can move around to absorb travel, so keeping their windows wide is what makes the rest of the day fit.",
  },
  {
    name: "Joint visits",
    body: "An assessment attended with a physiotherapist, social worker or family member. Where a second member of your own team must attend, set staff required to 2 so both diaries are held at once.",
  },
  {
    name: "Major adaptation visits",
    body: "Housing adaptations and complex assessments can run half a day. Treat them as the fixed point the rest of the day is built around rather than something to slot in.",
  },
];

const dailyRoutine = [
  {
    title: "Plan the week, then work a day at a time",
    body: "OT caseloads move more slowly than nursing ones — an assessment booked today may be three weeks out. Decide the week's shape first: which days are home visits, which are clinic, report writing or equipment ordering. Then schedule each visiting day individually, because that is where travel actually gets decided.",
  },
  {
    title: "Be honest about visit length",
    body: "This is the step OT services most often get wrong. An initial assessment is not an hour: it is an hour with the person, plus setting up, plus the conversation at the door that always happens, plus notes. Enter the time the visit genuinely occupies rather than the contact time. Four visits underestimated by twenty minutes each is a day that ends eighty minutes late.",
  },
  {
    title: "Group by geography before you group by anything else",
    body: "With few, long visits, travel is the largest controllable cost in the day. If the caseload allows any flexibility about which day someone is seen, use it to cluster visits in the same area onto the same day. A week planned this way rather than by referral order routinely saves a whole visit's worth of driving.",
  },
  {
    title: "Mark joint visits as needing two staff",
    body: "Joint visits with a physiotherapist, a social worker or a second OT for a moving-and-handling assessment need two diaries to align at one address. Set staff required to 2 rather than booking two separate visits and hoping. These are the hardest appointments to place, so give them the widest window the referral genuinely allows.",
  },
  {
    title: "Generate, and expect the day to look empty",
    body: "An OT day with four appointments and three hours of driving looks underused next to a home care round. It is not. Read the travel figures rather than the appointment count — that is the number that tells you whether the day is full, and it is the one that justifies the shape of the caseload to anyone asking.",
  },
  {
    title: "Leave slack for equipment and follow-up",
    body: "Equipment deliveries, chasing an order, an unplanned call back to a client who has had a fall — these fill the gaps between visits and are the reason a day scheduled to the minute never works. Either build shorter working hours than the theoretical maximum, or leave a visit slot unfilled deliberately.",
  },
];

const disruptions = [
  {
    name: "A visit needs rescheduling",
    body: "Move it rather than deleting and re-adding. The occurrence keeps its setup — duration, staff required, any skills — so a rebooked assessment does not quietly become a thirty-minute single-handed visit because someone re-entered it from memory.",
  },
  {
    name: "The caseload has clustered in one area",
    body: "This is an opportunity rather than a problem. If several referrals have come from the same part of the patch, pull them onto the same day even if it means one waits an extra two days. The travel saved is often larger than the delay costs.",
  },
  {
    name: "A joint visit will not fit anywhere",
    body: "Double-staffed visits fail to place more often than any other type, because they need two people free at once. Widen the window before you do anything else. If it still will not fit, the honest question is whether it genuinely needs two people for the whole visit or only for part of it.",
  },
  {
    name: "Assessments are consistently overrunning",
    body: "Increase the standard duration rather than absorbing it. A service where every assessment runs twenty minutes over is not a service with a discipline problem; it is a service whose assumed visit length is wrong. Correcting it makes every subsequent day honest.",
  },
];

const faqs = [
  {
    q: "We only do four or five visits a day. Is scheduling software worth it?",
    a: "That is precisely the case where travel dominates. With four visits and three journeys between them, driving can be a third of the working day, and the order you choose changes that materially. Fewer visits means each routing decision carries more weight, not less.",
  },
  {
    q: "How do I stop long assessments being scheduled back to back across the county?",
    a: "Enter honest durations and realistic working hours, and the scheduler will not overcommit the day. If two long assessments are genuinely far apart and both must happen today, it will tell you rather than producing a plan that quietly assumes impossible travel.",
  },
  {
    q: "How do I handle a visit where a family member must be present?",
    a: "Use a strict start time if the time is fixed, or a purpose window if there is a range that works. A window is better wherever the family can accommodate one, because it lets the scheduler place the visit where it fits the route.",
  },
  {
    q: "Can I schedule a joint visit with a physiotherapist?",
    a: "If both people are in your staff list, set staff required to 2 and the scheduler will allocate them together. If the other professional is from a different service and not in your list, model it as a strict start time you have agreed with them.",
  },
  {
    q: "Can I restrict certain assessments to specific therapists?",
    a: "Yes, using skills. Specialist areas such as paediatrics, wheelchair assessment, moving and handling or complex seating can be recorded as skills and required on the relevant visits, so they only go to therapists competent in them.",
  },
  {
    q: "Does it handle clinic sessions as well as home visits?",
    a: "A clinic block is best modelled by narrowing that therapist's working hours to the part of the day they are out on visits. The scheduler then plans only around the time genuinely available for community work.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Occupational therapy scheduling has the opposite problem to a care round. There are far fewer visits, but each is long and travel is a much larger proportion of the day — so the order you visit in matters more, not less."
    >
      <Section title="Why fewer visits is harder, not easier">
        <p>
          A care worker doing fifteen short calls in a tight geography loses
          little to any individual routing decision. An OT doing four
          assessments spread across a county can lose an hour to a poor
          ordering, because each leg is long and there are few of them to
          average out the mistake.
        </p>
        <p>
          This is why entering accurate durations matters so much here. A
          90-minute assessment recorded as an hour does not just make one visit
          wrong — it makes every subsequent arrival time wrong, and with only
          four visits in the day there is nothing to absorb the drift.
        </p>
      </Section>

      <Section title="Typical visit types">
        <FieldList fields={visitTypes} />
      </Section>

      <Section title="Building a workable OT day">
        <p>
          The pattern that works is to let the constrained visits anchor the day
          and the flexible ones fill around them. Equipment fittings and visits
          with a third party present get a fixed time or a narrow window.
          Assessments and reviews get wide windows, and the scheduler uses them
          to soak up the travel between the anchored points.
        </p>
        <p>
          If you constrain everything, you will get a plan that is really your
          own assumptions played back with more driving. The value comes from
          leaving the flexible visits genuinely flexible.
        </p>
        <Callout title="Where the time actually goes">
          Run a day and look at the staff summary. Teams are routinely surprised
          by the split between visiting and travelling — and that number is the
          honest case for or against how the patch is currently divided between
          therapists.
        </Callout>
      </Section>

      <Section title="Running an OT caseload day to day">
        <p>
          The routine for a service with four long visits a day looks nothing
          like one with sixty short calls. The decisions that matter are made
          when the week is planned, not when the day is generated.
        </p>
        <Steps steps={dailyRoutine} />
        <Callout title="Judge the day by travel, not by appointment count">
          Four visits and three hours of driving is a full day. The appointment
          count is the least useful number on the page for an OT service, and
          managing to it rather than to travel is how caseloads end up
          criss-crossing the patch.
        </Callout>
      </Section>

      <Section title="When the week does not go to plan">
        <p>
          Fewer appointments means each disruption costs proportionally more.
          These are the ones worth having a habit for.
        </p>
        <FieldList fields={disruptions} />
      </Section>

      <Section title="Related setup">
        <p>
          Specialist competencies are handled the same way as anywhere else in
          the tool — see{" "}
          <Link href="/help/staff-and-skills" className="text-teal-400 hover:text-teal-300">
            staff, skills and start locations
          </Link>
          . If your therapists work from home rather than a base, setting start
          location per person is usually the single highest-impact change you
          can make to a rural OT round.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
