import type { Metadata } from "next";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("staff-and-skills");
export const metadata: Metadata = guideMetadata(guide.slug);

const fields = [
  {
    name: "Name",
    body: "How the person appears on the schedule and the map. Each staff member is also given a colour, which is used consistently across the route lines, the map pins and the results list so you can follow one person's day at a glance.",
  },
  {
    name: "Home postcode",
    body: "Where the person lives. Used as the origin of their first journey when their start location is set to home, and as the destination of their last.",
  },
  {
    name: "Office postcode",
    body: "Your base. Used the same way when the person starts from the office. Teams that hold equipment or notes centrally usually start everyone here even if they live elsewhere.",
  },
  {
    name: "Start location",
    body: "Whether this person begins the day from home or from the office. This is per-person rather than a global setting, because mixed teams are normal — a nurse collecting supplies starts at base while a support worker goes straight out.",
  },
  {
    name: "Working hours",
    body: "The person's own start and end time. Nothing is scheduled outside them. These sit inside the overall day window, so the effective working period is whichever is narrower.",
  },
  {
    name: "Skills",
    body: "What this person is signed off to do. A visit that requires a skill will only be given to staff who hold it. Staff with no skills recorded can still take any visit that requires none.",
  },
];

const faqs = [
  {
    q: "How does skill matching actually work?",
    a: "A visit is only assigned to a staff member who holds every skill that visit requires. It is a strict check rather than a preference, so if nobody available holds the required skill, the visit is reported as unplaceable rather than being given to someone unqualified.",
  },
  {
    q: "What should I use skills for?",
    a: "Anything that determines who is allowed to do a visit rather than who would prefer to. Typical examples are clinical competencies like insulin administration, catheter care or PEG feeding; equipment sign-offs such as hoist or stairlift use; and non-clinical requirements like a driver with a van, a female worker where that has been requested, or a specific language.",
  },
  {
    q: "Can one person start from home and another from the office?",
    a: "Yes, and this is the normal case. Start location is set per staff member, so a team where some collect equipment from base and others drive straight to their first visit is handled without any workaround.",
  },
  {
    q: "Why does start location change the schedule so much?",
    a: "Because it moves the origin of the first journey, which changes which visit is cheapest to do first, which cascades through the rest of the day. Someone living on the far side of your patch may be the obvious person for the visits near them, but only if they start from home.",
  },
  {
    q: "Can staff have different hours on different days?",
    a: "Working hours are set per staff member for the round you are building. To plan a day where someone works different hours, adjust their hours before generating that day's schedule. Pro accounts keep your staff list saved, so this is an edit rather than a re-entry.",
  },
  {
    q: "How many staff can I add?",
    a: "Free mode allows 2, which is enough to see how the scheduler splits work between people. Pro accounts have no staff limit.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Staff records do more than name who is working. Start location, individual hours and skills each change which visits a person can be given, and getting them right is what makes the difference between a schedule that is technically valid and one your team can actually work to."
    >
      <Section title="The staff record">
        <p>
          Each staff member holds the following. Only the name and a start
          postcode are strictly required, but the rest is where the useful
          behaviour comes from.
        </p>
        <FieldList fields={fields} />
      </Section>

      <Section title="Using skills well">
        <p>
          Skills are a hard constraint. A visit requiring a skill will never be
          assigned to someone without it, which is exactly what you want for
          anything governed by competency or safeguarding — but it also means
          over-using them will make your schedule fail to fill.
        </p>
        <p>
          The practical guidance is to record a skill only when it genuinely
          determines eligibility. If a visit could be done by anyone but is
          usually done by a particular person, that is a preference, not a
          skill, and encoding it as one will make the scheduler refuse
          reasonable plans.
        </p>
        <Callout title="A common mistake">
          Recording a skill on the staff who happen to have it, but forgetting
          to require it on the visits that need it, achieves nothing — matching
          only happens when a visit asks for the skill. It is the requirement on
          the visit that drives the behaviour.
        </Callout>
      </Section>

      <Section title="When someone cannot be given any work">
        <p>
          If a staff member comes back with an empty or very light day, the
          cause is nearly always one of three things. Their working hours may be
          too narrow to fit a visit plus the travel to reach it. Their start
          location may put them far from the cluster of visits, making every
          assignment expensive relative to a colleague. Or the visits they could
          take may all require a skill they do not hold.
        </p>
        <p>
          Widening their hours by half an hour, or checking their start
          postcode, resolves most cases.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
