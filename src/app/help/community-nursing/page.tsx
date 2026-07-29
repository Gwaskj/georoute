import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "@/components/help/GuideShell";
import { Section, FieldList, Callout, FaqSection } from "@/components/help/GuideContent";
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

const faqs = [
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
          <Link href="/help/time-windows" className="text-teal-400 hover:text-teal-300">
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
