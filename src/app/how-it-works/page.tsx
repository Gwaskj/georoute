import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Add staff and visits, set your rules, and generate an optimised round in five steps. Real road distances, and client data that never leaves your browser.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    number: "01",
    title: "Add your staff",
    body: "Enter each team member's name, home or office postcode, and working hours. GeoRoutes uses this information to assign appointments fairly and calculate realistic travel times between locations.",
  },
  {
    number: "02",
    title: "Enter your appointments",
    body: "Add every client visit or appointment with their name, postcode, and estimated duration. You can also set call purposes (for example, assessment, routine review, or emergency) so GeoRoutes can apply different scheduling rules to different types of visit.",
  },
  {
    number: "03",
    title: "Configure your rules",
    body: "Set your working day window, define custom time windows for specific appointment types, and choose any constraints — such as a staff member who must always start and end at the office. These rules are applied automatically during schedule generation.",
  },
  {
    number: "04",
    title: "Generate an optimised schedule",
    body: "Click Generate and GeoRoutes' scheduling engine assigns every appointment to the most appropriate staff member, minimising travel time and maximising the number of appointments completed within the working day. Real road-distance data powers the routing, not straight-line estimates.",
  },
  {
    number: "05",
    title: "Review and export",
    body: "View the full generated schedule broken down by staff member, with start and end times for every visit, and follow each route on the map. Open a round as a multi-stop route in Google Maps or Apple Maps, or send it to a carer as a read-only link that needs no account — the visits travel inside the link rather than being stored anywhere.",
  },
];

const faqs = [
  {
    q: "Do I need to create an account?",
    a: "No. You can use GeoRoutes in free mode without registering, with up to 2 staff and 10 appointments. Creating a Pro account raises those limits and unlocks the calendar for recurring visits. Your scheduling data stays in your own browser on either plan.",
  },
  {
    q: "How does GeoRoutes calculate travel times?",
    a: "GeoRoutes uses the OpenRouteService routing API, which calculates real driving distances and times based on live road network data. UK postcodes are geocoded automatically, so you never need to enter coordinates manually.",
  },
  {
    q: "How many appointments can I schedule?",
    a: "Free mode supports 2 staff and 10 appointments. Pro raises that to unlimited staff and up to 100 appointments a day, which suits teams with large daily caseloads.",
  },
  {
    q: "Is my data secure?",
    a: "Your clients' names, addresses and visit times never reach us. They are held in your own browser, so there is no database of them for us to lose, be compelled to hand over, or read. That also means GeoRoutes is not a data processor under UK GDPR, so you do not need a data processing agreement with us in order to use it.",
  },
  {
    q: "What happens if I clear my browser or change computer?",
    a: "Because your data lives in your browser, clearing your browsing data removes it and there is no copy on our side to restore. Settings has an export that writes everything to a file — use it as a backup and to move to a new machine.",
  },
  {
    q: "Can I customise working hours for individual staff?",
    a: "Yes. Each staff member can have their own start and end time. You can also define custom windows that apply to specific appointment types, giving you fine-grained control over when different visit types are scheduled.",
  },
  {
    q: "What happens to my data if I cancel my Pro subscription?",
    a: "Nothing happens to it. Your staff and appointment data is in your browser rather than on our servers, so cancelling does not delete it — you simply return to the free tier's limits. Keep your own export as a backup.",
  },
];

export default function HowItWorksPage() {
  /**
   * FAQPage and HowTo, generated from the same arrays the page renders.
   *
   * Built from `faqs` and `steps` rather than written out separately, so the
   * markup cannot drift from what a visitor reads -- which is both the point
   * of structured data and the thing Google penalises when it stops matching.
   *
   * This page had seven questions and five numbered steps and emitted no
   * structured data at all, so it was competing for ordinary blue links while
   * describing exactly the content these two formats exist for.
   */
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "HowTo",
        name: "How to plan an optimised round with GeoRoutes",
        description:
          "Add staff and visits, set your scheduling rules, and generate a route-optimised daily schedule.",
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
    ],
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-16">

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How GeoRoutes Works
          </h1>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            GeoRoutes is a route-optimised scheduling tool for field teams. It
            takes your staff, your appointments, and your working rules — and
            produces an efficient daily schedule in seconds.
          </p>
        </div>

        {/* Steps */}
        <section className="mb-16">
          <h2 className="mb-8 text-xl font-semibold text-slate-100">
            From data to schedule in five steps
          </h2>
          <ol className="space-y-8">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-5">
                <span className="shrink-0 text-2xl font-bold text-teal-500 tabular-nums">
                  {step.number}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-100">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Key benefits */}
        <section className="mb-16 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-8">
          <h2 className="mb-6 text-xl font-semibold">Why teams use GeoRoutes</h2>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="text-teal-400 font-bold">→</span>
              <span>
                <strong className="text-slate-100">Save hours each week.</strong>{" "}
                Manual scheduling on paper or in spreadsheets can take an hour
                or more. GeoRoutes produces an optimised schedule in seconds.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-teal-400 font-bold">→</span>
              <span>
                <strong className="text-slate-100">Reduce fuel costs.</strong>{" "}
                Route optimisation minimises backtracking so staff travel the
                shortest practical route between appointments.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-teal-400 font-bold">→</span>
              <span>
                <strong className="text-slate-100">Handle complex rules.</strong>{" "}
                Custom time windows, call-purpose constraints, and per-staff
                working hours mean your scheduling rules are always respected.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-teal-400 font-bold">→</span>
              <span>
                <strong className="text-slate-100">Start free, scale as you grow.</strong>{" "}
                No credit card needed to try GeoRoutes. Upgrade to Pro when you
                need recurring visits and higher appointment limits.
              </span>
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="mb-8 text-xl font-semibold">
            Frequently asked questions
          </h2>
          <dl className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="mb-1 font-medium text-slate-100">{item.q}</dt>
                <dd className="text-sm leading-relaxed text-slate-300">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-900/30 to-slate-900/60 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Ready to get started?</h2>
          <p className="mb-6 text-sm text-slate-300">
            Try GeoRoutes free — no account required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/scheduler"
              className="inline-flex items-center rounded-full bg-teal-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 transition"
            >
              Open the scheduler
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full border border-slate-600 px-6 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
            >
              View pricing
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
