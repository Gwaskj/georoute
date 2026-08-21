import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, Steps, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
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

const dailyRoutine = [
  {
    title: "The evening before: confirm who is working",
    body: "Almost every failed round traces back to staff availability being wrong at the point the schedule was built. Before you generate anything, check tomorrow's carers against the rota: who is on, what hours, and whether anyone is starting from a different place than usual. A carer marked as working 07:00 to 15:00 who is actually on until 13:00 produces a round that looks fine on screen and collapses at lunchtime.",
  },
  {
    title: "Set the planning day and check what is due",
    body: "Set the date at the top of the scheduler. Recurring packages appear automatically for that day, so what you are looking at is the caseload as it actually stands — including anything moved onto this date from elsewhere. Read the count before you go further: if it is higher or lower than you expected, something has been moved or skipped and it is far cheaper to find out now.",
  },
  {
    title: "Add today's exceptions",
    body: "Hospital admissions, respite, a client away with family, a one-off extra call after a discharge. Skip the visits that are not happening and add the ones that are. This is the only part of the day that genuinely needs judgement, and it is worth doing carefully — a call left in for someone in hospital costs a carer a wasted journey.",
  },
  {
    title: "Generate, then read the warnings before the schedule",
    body: "The temptation is to look straight at the rounds. Read the warnings first. They name the specific visits that could not be placed and why — no one with the right skill available, a window too narrow to fit, a double-up where two diaries would not align. A schedule with three unplaced calls is not a finished schedule, and finding that out at 07:00 tomorrow is the expensive version.",
  },
  {
    title: "Resolve what could not be placed",
    body: "Each warning has a small number of honest fixes: widen the window, extend someone's hours, move the call to another day, split a double-up across two times, or accept it needs agency cover. Change the input and generate again. What you should not do is quietly drop the visit — the whole point of the warning is that someone has to decide, and it should be a decision rather than an omission.",
  },
  {
    title: "Check the map before you send anything",
    body: "The timings can be perfectly valid and the day still be wrong. Look at each carer's route on the map: a round that crosses the patch twice usually means a window is tighter than it needs to be, or a call is pinned to a strict time that only needs a window. Thirty seconds here often saves an hour of driving.",
  },
  {
    title: "Share each round with the carer",
    body: "Send each staff member their own round as a link. They see their stops in order with arrival times and can open the whole day as a multi-stop route in Google Maps, Apple Maps or Waze rather than typing postcodes one at a time. Links are read-only and expire, so a round that has been superseded stops working rather than sending someone to yesterday's calls.",
  },
];

const disruptions = [
  {
    name: "A carer calls in sick",
    body: "Reduce that carer's hours to nothing or remove them for the day, then regenerate. The scheduler redistributes their calls across whoever is left and tells you plainly which ones will not fit — which is the number you need when deciding whether to call in agency cover. Reassigning by hand hides the shortfall until someone is standing outside a door.",
  },
  {
    name: "A client goes into hospital",
    body: "Skip the visits rather than deleting the client. Skipping removes them from the days affected while keeping the package intact, so when they come home you unskip rather than rebuilding the whole care package from memory.",
  },
  {
    name: "A new package starts mid-week",
    body: "Add the client with the full pattern — visits required, gap, purposes, durations — and set the recurrence to start from the right date. Do not add today's calls as one-offs and mean to set up the pattern later; that is how a package ends up existing only in someone's head.",
  },
  {
    name: "The round is consistently overrunning",
    body: "This is a capacity problem wearing a scheduling costume. Check the durations against how long calls genuinely take, including getting in and out of the property. Fifteen minutes of optimism per call across a thirty-call round is seven and a half hours that does not exist, and no amount of routing recovers it.",
  },
];

const faqs = [
  {
    q: "How do I plan a care round day to day?",
    a: "Confirm who is working, set the planning day so recurring packages appear, add the day's exceptions such as hospital admissions or extra calls, generate, then read the warnings before the rounds. Resolve anything that could not be placed by changing the input and generating again, check each carer's route on the map for obvious back-tracking, then share each round with the carer as a read-only link. The loop is: change the input, regenerate, reissue — never edit a generated round by hand.",
  },
  {
    q: "What should I do when a carer calls in sick?",
    a: "Remove that carer or set their hours to nothing for the day and generate again. The scheduler redistributes their calls and names the ones that will not fit, which tells you exactly how much agency cover you need. Reassigning calls by hand hides the shortfall until a visit is missed.",
  },
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

      <Section title="Running it day to day">
        <p>
          Setting a service up is a one-off. Running it is a routine, and the
          routine is what most people actually need help with. This is the shape
          a working day takes once the initial setup is done.
        </p>
        <Steps steps={dailyRoutine} />
        <Callout title="Regenerate rather than patch">
          The instinct when something changes is to shuffle the affected calls
          by hand. Resist it. Moving one call by hand leaves every downstream
          arrival time wrong on the printed round, and the travel between them
          silently stops matching reality. Change the input and generate again
          — it takes seconds, and the whole day stays consistent.
        </Callout>
      </Section>

      <Section title="Handling the things that go wrong">
        <p>
          No round survives contact with a Tuesday. These are the four
          disruptions that come up most, and the quickest way through each.
        </p>
        <FieldList fields={disruptions} />
        <p>
          The common thread is that each one is a change to an input — who is
          working, who needs visiting, how long for — rather than a change to
          the schedule itself. Express the change, regenerate, reissue. That
          loop is the whole operating model.
        </p>
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
          <Link href="/help/appointments-and-visits" className="text-teal-400 underline hover:text-teal-300">
            appointments, double-ups and repeat visits
          </Link>{" "}
          covers each field in turn.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
