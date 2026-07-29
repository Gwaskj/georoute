import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("appointments-and-visits");
export const metadata: Metadata = guideMetadata(guide.slug);

const fields = [
  {
    name: "Name and address",
    body: "Who is being visited and where. The postcode drives the routing; the house name or number and the rest of the address are carried through to the schedule so whoever is doing the visit knows exactly where to knock.",
  },
  {
    name: "Duration",
    body: "How long the visit itself takes, excluding travel. This is the number that most affects how many visits fit in a day, so it is worth being honest about it rather than optimistic.",
  },
  {
    name: "Strict start time",
    body: "Pins the visit to an exact time. Use it only where the time genuinely cannot move — a medication round tied to a dose interval, or a visit arranged around a third party such as a delivery or a family member being present.",
  },
  {
    name: "Staff required",
    body: "How many people must attend together. Set this to 2 for a double-up, and the scheduler will hold two staff at the same address for the same slot rather than sending them separately.",
  },
  {
    name: "Visits required",
    body: "How many separate visits this person needs during the day. Set it to 4 for someone on morning, lunch, tea and bed calls and the scheduler will place four visits rather than one.",
  },
  {
    name: "Minimum gap",
    body: "The least time that must pass between one visit to this person and the next. This is what stops four calls a day being stacked into one afternoon.",
  },
  {
    name: "Call purpose",
    body: "Which type of visit this is. Purposes carry their own time window, so tagging a visit as a morning call keeps it in the morning without setting a time on each one individually.",
  },
  {
    name: "Notes",
    body: "Anything the person doing the visit needs to know. Notes do not affect scheduling — they are carried through to the output.",
  },
];

const faqs = [
  {
    q: "How do I schedule a double-up call?",
    a: "Set staff required to 2 on that visit. The scheduler will allocate two staff members to the same address at the same time, and both people's routes will account for the visit. It will only do this if two suitably qualified staff are actually free at a workable time — otherwise the visit is reported as unplaceable rather than being quietly downgraded to one carer.",
  },
  {
    q: "How do I set up four calls a day to the same person?",
    a: "Set visits required to 4 on that person's record and give a minimum gap that reflects how far apart the calls need to be. If the calls also need to land in particular parts of the day, use call purposes with time windows rather than four fixed times — it gives the scheduler room to optimise travel while still keeping the tea call in the evening.",
  },
  {
    q: "What is the difference between minimum gap and a time window?",
    a: "A minimum gap is relative — it controls the spacing between visits to the same person, wherever they land. A time window is absolute — it controls what part of the clock a visit can occupy. Most repeat-visit rounds need both: a window to keep the bed call at night, and a gap so it cannot be scheduled an hour after the tea call.",
  },
  {
    q: "When should I use a strict start time?",
    a: "Sparingly. Every strict time removes a degree of freedom from the scheduler, and a day with many of them is really a hand-built rota with extra steps. Use one where the clock time is genuinely fixed and use a time window everywhere else — the result is usually less travel and fewer unplaceable visits.",
  },
  {
    q: "Why was my visit not scheduled?",
    a: "Usually one constraint has made it impossible rather than the day being full. Common causes are a strict start time that collides with travel from the previous visit, a required skill nobody on shift holds, a duration that will not fit inside the available window, or a double-up where only one qualified person is free. The warnings after generation name the visit so you can see which one to relax.",
  },
  {
    q: "How many appointments can I add?",
    a: "Free mode allows 10 per session. Pro accounts allow up to 100 appointments a day, which covers most single-team rounds.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Most real rounds are not a simple list of stops. People need two carers at once, or four calls spread across the day, or a visit that cannot start before the district nurse has been. These are the fields that express those rules."
    >
      <Section title="The appointment record">
        <FieldList fields={fields} />
      </Section>

      <Section title="Double-up visits">
        <p>
          A double-up is any visit that needs two people present at the same
          time — commonly a hoist transfer, a moving-and-handling task, or a
          visit where lone working has been assessed as unsafe. Setting staff
          required to 2 makes the scheduler treat it as one visit consuming two
          people, not as two separate visits that happen to share an address.
        </p>
        <p>
          This is harder to schedule than it looks, because it needs two people
          free at the same moment, both able to reach the address, and both
          holding any required skills. If double-ups are failing to place, the
          usual fix is to widen the time window on them rather than to add
          staff — a double-up pinned to an exact time has to align two diaries
          at once.
        </p>
      </Section>

      <Section title="Several visits to the same person">
        <p>
          Repeat visits are the norm in home care and in any service with a call
          pattern. Rather than entering the same person four times, set visits
          required to the number of calls and let the scheduler place them.
        </p>
        <p>
          The minimum gap is what makes this behave sensibly. Without it,
          nothing prevents two calls being scheduled back to back, which is
          efficient on paper and useless in practice. With a gap of, say, three
          hours, the calls spread naturally across the day. Combine it with call
          purposes — covered in{" "}
          <Link href="/help/time-windows" className="text-teal-400 hover:text-teal-300">
            call purposes and time windows
          </Link>{" "}
          — when the calls also need to sit in particular parts of the day.
        </p>
        <Callout title="Rule of thumb">
          Use the loosest constraint that still describes your actual
          requirement. A window of 07:00–11:00 will nearly always produce less
          travel than a strict 08:00, and in most services the real requirement
          genuinely is &ldquo;some time in the morning&rdquo;.
        </Callout>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
