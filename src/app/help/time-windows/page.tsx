import type { Metadata } from "next";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("time-windows");
export const metadata: Metadata = guideMetadata(guide.slug);

const layers = [
  {
    name: "The day window",
    body: "The outer boundary for everybody, set once for the whole schedule — for example 07:00 to 20:00. Nothing is placed outside it. Think of it as the limits of your service rather than anyone's shift.",
  },
  {
    name: "Individual working hours",
    body: "Each staff member's own start and end time, which narrows the day window for that person. Someone working 09:00 to 15:00 inside a 07:00 to 20:00 service will only ever be given work in their own hours.",
  },
  {
    name: "Call purposes",
    body: "A named type of visit with its own window — a morning call that must fall between 07:00 and 11:00, or an evening call between 18:00 and 22:00. Tag a visit with a purpose and it inherits that window, so you set the rule once and apply it to hundreds of visits.",
  },
  {
    name: "Custom windows",
    body: "A named window you define yourself, with its own start, end, and a minimum gap to whatever follows it. Useful where a category of work has its own rhythm that is not simply a time of day.",
  },
  {
    name: "Strict start time",
    body: "The narrowest control: a single visit pinned to an exact clock time. Overrides the flexibility of everything above it for that one visit.",
  },
];

const faqs = [
  {
    q: "What is the difference between a call purpose and a custom window?",
    a: "A call purpose is a label for a kind of visit that carries a time window with it — morning call, evening call, medication round. A custom window is a reusable window in its own right, and it also carries a minimum gap to the next visit. In practice most teams use purposes to describe what a visit is, and reach for custom windows when they need to control spacing as well as timing.",
  },
  {
    q: "Which wins if two rules disagree?",
    a: "The narrowest one. The layers stack rather than override, so a visit's effective window is the overlap of the day window, the assigned staff member's working hours, and any purpose or custom window on the visit. If those do not overlap at all, the visit cannot be placed and you will get a warning naming it.",
  },
  {
    q: "Why is a window better than a fixed time?",
    a: "Because it gives the scheduler room to reduce travel. A visit fixed at 09:00 must happen at 09:00 regardless of where the person doing it is at 08:45. The same visit with an 08:00–11:00 window can be slotted where it sits naturally on the route, which typically means less driving across the whole round and more visits fitting in the day.",
  },
  {
    q: "Can I have a window that crosses midnight?",
    a: "Windows are expressed within a single working day, so a genuine overnight service is better modelled as its own schedule with a day window covering the night hours than as a window that wraps around midnight.",
  },
  {
    q: "My morning calls are all landing at 10:45. Why?",
    a: "That is usually the window being satisfied at its last possible moment because the travel or the durations before it do not allow anything earlier. It is a signal that the morning is genuinely over-committed — either too many calls in the window for the staff available, or durations that are longer than the window can absorb. Widening the window hides the problem; adding capacity or moving a call to another purpose fixes it.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Almost every real service has rules about when things can happen, not just what needs doing. Time windows are how you express those rules once and have them applied across the whole round, instead of hand-placing visits on a clock."
    >
      <Section title="Five layers, narrowest wins">
        <p>
          Timing is controlled at five levels. They stack rather than compete:
          the time a visit can actually occupy is the overlap of all of them.
        </p>
        <FieldList fields={layers} />
      </Section>

      <Section title="Setting up a call pattern">
        <p>
          The most common setup is a service with a repeating daily pattern —
          morning, lunch, tea and bed calls. Rather than putting a time on every
          visit, define each of those as a call purpose with a window, then tag
          visits with the purpose that applies. A new client joining the round
          needs only the right purposes, not a hand-built timetable.
        </p>
        <p>
          This also makes changes cheap. If your morning round is consistently
          running late and you decide it should start half an hour earlier, you
          change the morning purpose once rather than editing every visit.
        </p>
        <Callout title="Keep windows as wide as the truth allows">
          Every hour you remove from a window removes options from the
          scheduler. A window that reflects a real requirement produces better
          schedules than one tightened to what you expect the answer to look
          like — the scheduler is usually better at finding the ordering than
          our intuitions are.
        </Callout>
      </Section>

      <Section title="When windows make a schedule fail">
        <p>
          If visits start coming back unplaceable, windows are the first thing
          to check, because they are the constraint most likely to be
          accidentally impossible. A visit with a 60-minute duration and a
          60-minute window can only be placed if travel to it costs nothing,
          which never happens.
        </p>
        <p>
          The same applies to a window that sits outside the working hours of
          every member of staff who holds the required skill. The constraint is
          individually reasonable in each place and impossible in combination,
          which is why the warnings name the specific visit rather than telling
          you the day is full.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
