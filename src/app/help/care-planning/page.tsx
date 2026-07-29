import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("care-planning");
export const metadata: Metadata = guideMetadata(guide.slug);

const pattern = [
  {
    name: "Morning call — 07:00 to 11:00",
    body: "The heaviest and least flexible part of the day. Getting people up, washed, dressed and given breakfast and morning medication. Everyone wants it early, which is why it is the round that most often fails to fit.",
  },
  {
    name: "Lunch call — 11:30 to 14:00",
    body: "Usually shorter. Meal preparation, a check-in, sometimes a second medication round. The window is tight because a lunch call at 15:00 is not a lunch call.",
  },
  {
    name: "Tea call — 16:00 to 19:00",
    body: "Evening meal and a check. Often overlaps with the start of the bed round for a different set of clients, which is where double-booking creeps in when rounds are planned by hand.",
  },
  {
    name: "Bed call — 19:00 to 22:00",
    body: "Settling people for the night. The window matters more than the exact time, and putting someone to bed at 18:30 because it suited the route is the classic complaint about badly planned rounds.",
  },
];

const faqs = [
  {
    q: "Can GeoRoutes be used as care planning software?",
    a: "It plans the scheduling and routing side of care delivery — who visits whom, in what order, at what time, and how they travel between calls. It is not a care records system: it does not hold care plans, risk assessments, medication records or notes against a person. Services typically keep their existing records system and use GeoRoutes to build the rounds those records describe.",
  },
  {
    q: "How do I handle a client with four calls a day?",
    a: "Set visits required to 4 on that client and give a minimum gap so the calls cannot bunch. Then tag them with call purposes — morning, lunch, tea, bed — so each one lands in the right part of the day. The scheduler places all four inside their windows while still routing efficiently between other clients.",
  },
  {
    q: "How are double-up calls scheduled?",
    a: "Set staff required to 2 on the call. The scheduler holds two carers at the same address for the same slot rather than sending them separately. Double-ups are the hardest calls to place because they need two diaries to align, so it helps to give them the widest window your care plan genuinely allows.",
  },
  {
    q: "Does it support continuity of carer?",
    a: "Partially, and it is worth being clear about the limits. Skills can be used to restrict a client's calls to a named group of carers, which achieves continuity where it is a genuine requirement — a client who has requested a female carer, or one where only certain staff are trained on their equipment. There is no separate preference system that keeps the same carer where it is desirable but not required.",
  },
  {
    q: "What about calls that must happen at an exact time?",
    a: "Use a strict start time, but sparingly. Time-critical medication is a legitimate case. Most calls described as needing a fixed time actually need a window, and expressing them as windows will noticeably reduce travel across the round and let more calls fit in the day.",
  },
  {
    q: "Can it plan a whole week at once?",
    a: "Schedules are built a day at a time. For a service with a stable weekly pattern, this means generating each day rather than one weekly plan — which in practice is what most rounds need anyway, because staff availability changes day to day.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="Home care rounds are one of the hardest scheduling problems in the community: several calls a day to the same person, calls that need two carers, tight windows at both ends of the day, and travel between every single one. This covers how to express a care package as something the scheduler can plan."
    >
      <Section title="The shape of a domiciliary round">
        <p>
          Most home care services run a repeating daily pattern. Setting these
          up as call purposes once — rather than as times on individual visits —
          is what makes the round maintainable when clients join and leave.
        </p>
        <FieldList fields={pattern} />
        <p>
          The exact windows will differ by service. What matters is that they
          are defined once as purposes and then applied by tagging, so changing
          your morning round means changing one window rather than a hundred
          visits.
        </p>
      </Section>

      <Section title="Turning a care package into a schedule">
        <p>
          A care package usually reads as something like: four calls a day, two
          carers at the morning and bed calls, 45 minutes in the morning and 30
          minutes for the rest, medication at the morning call. That translates
          directly.
        </p>
        <p>
          Visits required becomes 4. Staff required becomes 2 on the calls that
          need a double-up. Duration is set per call rather than averaged across
          the package. The minimum gap stops calls bunching, and the call
          purposes place each one in the right part of the day. Nothing about
          this requires you to decide the order or the times — that is what the
          scheduler is for.
        </p>
        <Callout title="Where rounds usually break">
          The morning. Nearly every client wants an early call, the calls are
          the longest of the day, and many of them are double-ups. If your
          schedule fails, it will almost always fail here — and the honest fix
          is usually capacity or a wider window, not a cleverer route.
        </Callout>
      </Section>

      <Section title="What this does not do">
        <p>
          It is worth being direct about the boundary. GeoRoutes plans and
          routes visits. It does not hold care plans, medication administration
          records, risk assessments or daily notes, and it is not a care
          management or rostering system in the regulatory sense. Services
          normally keep whatever records system they already use and use this to
          build the rounds.
        </p>
        <p>
          If you are looking for the mechanics of double-ups, repeat calls and
          gaps in more detail, the guide on{" "}
          <Link href="/help/appointments-and-visits" className="text-teal-400 hover:text-teal-300">
            appointments, double-ups and repeat visits
          </Link>{" "}
          covers each field in turn.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
