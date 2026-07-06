import type { Metadata } from "next";
import Link from "next/link";
import FreeTierAdSlot from "@/components/ads/FreeTierAdSlot";

export const metadata: Metadata = {
  title: "How It Works – GeoRoute",
  description:
    "Learn how GeoRoute helps field teams plan smarter schedules, assign staff efficiently, and generate optimised routes — all in one tool.",
};

const steps = [
  {
    number: "01",
    title: "Add your staff",
    body: "Enter each team member's name, home or office postcode, and working hours. GeoRoute uses this information to assign appointments fairly and calculate realistic travel times between locations.",
  },
  {
    number: "02",
    title: "Enter your appointments",
    body: "Add every client visit or appointment with their name, postcode, and estimated duration. You can also set call purposes (for example, assessment, routine review, or emergency) so GeoRoute can apply different scheduling rules to different types of visit.",
  },
  {
    number: "03",
    title: "Configure your rules",
    body: "Set your working day window, define custom time windows for specific appointment types, and choose any constraints — such as a staff member who must always start and end at the office. These rules are applied automatically during schedule generation.",
  },
  {
    number: "04",
    title: "Generate an optimised schedule",
    body: "Click Generate and GeoRoute's scheduling engine assigns every appointment to the most appropriate staff member, minimising travel time and maximising the number of appointments completed within the working day. Real road-distance data powers the routing, not straight-line estimates.",
  },
  {
    number: "05",
    title: "Review and export",
    body: "View the full generated schedule broken down by staff member, with start and end times for every visit. Pro users can save and retrieve their schedule history, share it with their team, and export it for use in other tools.",
  },
];

const faqs = [
  {
    q: "Do I need to create an account?",
    a: "No. You can use GeoRoute in free mode without registering — your data is stored only in your browser session. Creating an account (Pro) saves your staff, appointments, and schedule history to the cloud so you can access it from any device.",
  },
  {
    q: "How does GeoRoute calculate travel times?",
    a: "GeoRoute uses the OpenRouteService routing API, which calculates real driving distances and times based on live road network data. UK postcodes are geocoded automatically, so you never need to enter coordinates manually.",
  },
  {
    q: "How many appointments can I schedule?",
    a: "Free mode supports a limited number of staff and appointments per session. Pro users have higher limits and cloud persistence, making GeoRoute suitable for teams with large daily caseloads.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Pro account data is stored in a secure cloud database with row-level security — your records are only ever accessible to your own account. Free mode data never leaves your browser.",
  },
  {
    q: "Can I customise working hours for individual staff?",
    a: "Yes. Each staff member can have their own start and end time. You can also define custom windows that apply to specific appointment types, giving you fine-grained control over when different visit types are scheduled.",
  },
  {
    q: "What happens to my data if I cancel my Pro subscription?",
    a: "Your staff and appointment data is retained for 30 days after your subscription ends. If you resubscribe within that period, your data is fully restored. After 30 days, it is automatically and permanently deleted from our servers.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-16">

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How GeoRoute Works
          </h1>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            GeoRoute is a route-optimised scheduling tool for field teams. It
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
          <h2 className="mb-6 text-xl font-semibold">Why teams use GeoRoute</h2>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="text-teal-400 font-bold">→</span>
              <span>
                <strong className="text-slate-100">Save hours each week.</strong>{" "}
                Manual scheduling on paper or in spreadsheets can take an hour
                or more. GeoRoute produces an optimised schedule in seconds.
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
                No credit card needed to try GeoRoute. Upgrade to Pro when you
                need cloud storage and higher appointment limits.
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
            Try GeoRoute free — no account required.
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

        <div className="mt-10">
          <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-600">
            Advertisement
          </p>
          <FreeTierAdSlot />
        </div>

      </div>
    </div>
  );
}
