import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, Steps, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
import { getGuide, guideMetadata } from "@/lib/help/guides";

const guide = getGuide("community-nursing");
export const metadata: Metadata = guideMetadata(guide.slug);

const constraints = [
  {
    name: "Insulin and time-critical medication",
    body: "Has to happen inside a real clinical window, often relative to a meal. This is one of the few genuine uses for a strict start time, or a narrow purpose window where there is some tolerance.",
  },
  {
    name: "Clinical competency",
    body: "Not every nurse can do every visit. Catheterisation, PEG feeding, syringe drivers, IV therapy and complex wound care are all sign-off dependent. Record each as a skill and require it on the visits that need it.",
  },
  {
    name: "Dressing changes on a schedule",
    body: "Wound care often runs on an interval — every second or third day — rather than daily. The day's caseload is therefore different every morning, which is why a fixed weekly rota rarely survives contact with reality.",
  },
  {
    name: "Unplanned and urgent visits",
    body: "A palliative call or a deteriorating patient lands mid-morning and has to be absorbed. The practical approach is to regenerate the remainder of the day rather than hand-patch the original plan.",
  },
  {
    name: "Band-appropriate allocation",
    body: "Some visits need a registered nurse; others are appropriate for a healthcare assistant. Skills express this cleanly — record the band or competency and require it where the visit demands it.",
  },
];

const dailyRoutine = [
  {
    title: "Start from the caseload, not yesterday's round",
    body: "District nursing caseloads change daily — discharges arrive, patients are admitted, a wound review ends, a new referral lands. Set the planning day first and read what the scheduler says is due before adding anything. Rebuilding from yesterday's round is how a discharged patient keeps getting visited for a fortnight.",
  },
  {
    title: "Place the clinically fixed visits first",
    body: "Insulin and other time-critical administration is the fixed point the rest of the day bends around. Give these a strict start time only where the clinical requirement is genuinely a time rather than a window — twice-daily insulin needs a spacing and a rough part of the day, not 08:00 exactly. Over-using strict times is the single most common reason a nursing round will not fit.",
  },
  {
    title: "Check skills cover today's caseload",
    body: "Skills are what stop a visit going to someone not signed off to do it — syringe drivers, catheterisation, complex wound care, paediatric competencies. Before generating, confirm the staff on today have the skills the day's visits demand. A caseload that is fine on Tuesday can be unschedulable on Wednesday purely because the one nurse with a particular competency is off.",
  },
  {
    title: "Generate and read the warnings as a clinical safety check",
    body: "In nursing the warnings matter more than in most services, because an unplaced visit may be time-critical medication rather than an inconvenience. Read them first. Each names the visit and the reason — no one qualified available, window too narrow, capacity exceeded — and each needs a decision rather than a shrug.",
  },
  {
    title: "Escalate what genuinely cannot be placed",
    body: "Some visits should not be quietly rolled to tomorrow. If a time-critical visit cannot be placed, the honest answers are to extend cover, ask a neighbouring team, or escalate — not to widen a clinical window until the software stops complaining. The scheduler is telling you about a real capacity problem.",
  },
  {
    title: "Send rounds out and keep them current",
    body: "Share each nurse's round as a read-only link. When the caseload changes mid-morning — an urgent visit, a patient admitted — change the input and regenerate rather than phoning through amendments. Links expire, so a superseded round stops working instead of sending someone to a visit that no longer exists.",
  },
];

const disruptions = [
  {
    name: "An urgent visit comes in mid-morning",
    body: "Add it with a window covering the rest of the day and regenerate. The scheduler fits it into whichever round can absorb it with least disruption, which is rarely the nurse you would have guessed. Reissue the affected rounds — that is why the links are read-only and regenerable rather than printed sheets.",
  },
  {
    name: "The only nurse with a competency is off",
    body: "The visits needing that skill will appear as warnings naming the skill. That is the information you need to decide between borrowing from a neighbouring team, deferring where clinically safe, or escalating. It is better to see the list than to discover it at the door.",
  },
  {
    name: "A patient is discharged from the caseload",
    body: "End the recurrence rather than deleting the record, so the visit history stays intact and the pattern stops appearing on future days. Deleting outright loses the setup if they are re-referred a month later, which in district nursing happens often.",
  },
  {
    name: "Travel is eating the day",
    body: "Nursing patches are often geographically wide with few visits, so travel dominates in a way it does not in home care. Check whether nurses are starting from base when they could start from home, and whether the patch is genuinely being split sensibly between staff. Both are set once and pay back every day.",
  },
];

const faqs = [
  {
    q: "How do district nurses plan their visits each day?",
    a: "Set the planning day and read the caseload the scheduler says is due, since district nursing caseloads change daily with discharges and new referrals. Place clinically fixed visits such as insulin using time windows rather than exact times wherever the clinical requirement allows, confirm the staff on duty hold the skills the day's visits need, then generate and read the warnings before the rounds. Unplaced time-critical visits need escalating rather than rolling over.",
  },
  {
    q: "How should insulin and other time-critical visits be scheduled?",
    a: "Use a strict start time only where the clinical requirement genuinely is an exact time. Most time-critical visits need a window and a minimum spacing between doses rather than a fixed clock time, and expressing them as windows lets far more of the round fit. Over-using strict times is the most common reason a nursing round becomes unschedulable.",
  },

  {
    q: "How do I handle insulin visits that must happen at a set time?",
    a: "Where the time is genuinely fixed, use a strict start time on that visit. Where there is clinical tolerance — anywhere in the morning before breakfast, for instance — a call purpose with a window will produce a much better round, because it lets the scheduler fit the visit to the route rather than forcing the route around the visit.",
  },
  {
    q: "How do I make sure only qualified nurses get certain visits?",
    a: "Record the competency as a skill on the staff who hold it, and require that skill on the visits that need it. The match is strict: a visit requiring a skill will never be allocated to someone without it. If nobody on shift holds it, the visit is reported as unplaceable rather than being given to an unqualified colleague.",
  },
  {
    q: "Our caseload changes every day. Is that a problem?",
    a: "No — it is the normal case, and it is the main argument for generating a round rather than running a fixed rota. Enter the visits that are due today, generate, and you get a plan built around today's actual geography rather than last week's.",
  },
  {
    q: "Can it cope with an urgent visit added mid-shift?",
    a: "Add the visit and regenerate. You will get a fresh plan for the day including the new visit. Visits already completed are best removed before regenerating so the scheduler is only planning what is left.",
  },
  {
    q: "Can two nurses attend the same patient together?",
    a: "Yes — set staff required to 2. This covers visits needing a second pair of hands for moving and handling, or a second checker for controlled drugs.",
  },
  {
    q: "Does it integrate with our clinical records system?",
    a: "No. GeoRoutes plans and routes visits; it holds no clinical record, and patient identifiable information beyond a name and address is neither needed nor stored. Teams typically keep their clinical system as the record and use this to plan the day's travel.",
  },
];

export default function Page() {
  return (
    <GuideShell
      guide={guide}
      lead="District and community nursing has a scheduling problem that a fixed rota cannot solve: the caseload is different every day, a significant share of visits are time-critical, and not every nurse is signed off for every task. This covers how to express those three things."
    >
      <Section title="What makes nursing rounds different">
        <p>
          Compared with a care round, a nursing caseload is less repetitive and
          more constrained. Fewer visits, but more of them carry a hard clinical
          requirement about who does them and when.
        </p>
        <FieldList fields={constraints} />
      </Section>

      <Section title="Skills are doing the heavy lifting">
        <p>
          In most nursing setups the skills list is the single most important
          piece of configuration, because it is what stops a valid-looking
          schedule being clinically wrong. Record competencies at the level you
          actually make allocation decisions at — if you would not hesitate to
          send either of two nurses to a visit, they do not need distinguishing.
        </p>
        <p>
          The failure mode to watch for is over-specifying. If every visit
          requires a skill only one person holds, you have not built a schedule,
          you have built that person&apos;s diary, and the scheduler will report
          the rest as unplaceable. Skills should describe genuine eligibility,
          not habit.
        </p>
        <Callout title="Practical tip">
          When a visit comes back unplaceable, check the skill requirement
          before anything else. It is the constraint most likely to be
          impossible without looking impossible, because each individual
          requirement seems perfectly reasonable in isolation.
        </Callout>
      </Section>

      <Section title="Running a nursing round day to day">
        <p>
          Setting the service up happens once. The daily routine is what
          actually determines whether visits land, and it differs from home care
          in one important way: an unplaced visit here can be a clinical risk
          rather than an inconvenience.
        </p>
        <Steps steps={dailyRoutine} />
        <Callout title="Warnings are a safety check, not a formality">
          Read them before you look at the rounds. A warning naming an insulin
          visit that could not be placed is not a scheduling annoyance to be
          tidied up later — it is the system telling you a clinical commitment
          has no one assigned to it.
        </Callout>
      </Section>

      <Section title="When the day changes under you">
        <p>
          District nursing changes more within a day than most community
          services. These are the disruptions that come up most often.
        </p>
        <FieldList fields={disruptions} />
      </Section>

      <Section title="Planning around the day, not the week">
        <p>
          Because dressings run on intervals and urgent visits arrive without
          notice, the useful unit is the day. Enter what is due, generate, and
          treat the output as today&apos;s plan rather than a standing rota.
          Regenerating after a change takes seconds, which makes it realistic to
          replan at midday when something lands.
        </p>
        <p>
          If several visits share a clinical window, the guide on{" "}
          <Link href="/help/time-windows" className="text-teal-400 underline hover:text-teal-300">
            call purposes and time windows
          </Link>{" "}
          explains how to define that window once and apply it by tagging rather
          than setting a time on each visit.
        </p>
      </Section>

      <FaqSection faqs={faqs} />
    </GuideShell>
  );
}
