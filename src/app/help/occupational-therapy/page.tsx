import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
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
