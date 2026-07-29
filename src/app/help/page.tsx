import type { Metadata } from "next";
import Link from "next/link";
import FreeTierAdSlot from "@/components/ads/FreeTierAdSlot";
import { SITE_URL } from "@/lib/siteUrl";
import { BASICS, SECTORS, GUIDES } from "@/lib/help/guides";

export const metadata: Metadata = {
  title: "Help and Guides",
  description:
    "Guides for scheduling community visits with GeoRoutes — care planning and domiciliary rounds, district nursing, occupational therapy and physiotherapy caseloads, plus how to set up staff, skills and time windows.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "Help and Guides – GeoRoutes",
    description:
      "Step-by-step guides for planning community visits: care rounds, nursing caseloads, occupational therapy and physiotherapy scheduling.",
    url: `${SITE_URL}/help`,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Help", item: `${SITE_URL}/help` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "GeoRoutes Help and Guides",
    description:
      "Guides for scheduling community visits, care rounds and clinical caseloads with GeoRoutes.",
    url: `${SITE_URL}/help`,
    inLanguage: "en-GB",
    hasPart: GUIDES.map((g) => ({
      "@type": "TechArticle",
      headline: g.title,
      description: g.description,
      url: `${SITE_URL}/help/${g.slug}`,
    })),
  },
];

function GuideCard({
  slug,
  title,
  description,
  minutes,
}: {
  slug: string;
  title: string;
  description: string;
  minutes: number;
}) {
  return (
    <li>
      <Link
        href={`/help/${slug}`}
        className="group block rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4 transition hover:border-teal-500/40 hover:bg-slate-900"
      >
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h3 className="font-semibold text-slate-100 group-hover:text-teal-300">
            {title}
          </h3>
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-slate-500">
            {minutes} min
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </Link>
    </li>
  );
}

export default function HelpPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <header className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Help and guides
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            GeoRoutes is a multipurpose scheduler for teams who work out in the
            community rather than from one building. It takes a list of people
            to visit, a list of staff, and the rules you work to — then builds
            each person&apos;s day around real driving distances instead of
            straight lines on a map.
          </p>
        </header>

        <section className="mb-14 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-6">
          <h2 className="mb-3 text-base font-semibold">Who this is built for</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            The same scheduling problem turns up under a lot of different job
            titles. Home care and reablement services use it as care planning
            software for morning, lunch, tea and bed rounds. District and
            community nursing teams use it for insulin and dressing visits that
            have to happen inside a fixed window. Occupational therapy and
            physiotherapy services use it for longer assessment and rehab
            visits, where a handful of appointments can still eat a whole day in
            travel. Housing officers, support workers and mobile engineers use
            it for the same reason.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            The guides below start with the basics, then cover how each of those
            services tends to set things up.
          </p>
        </section>

        <section className="mb-14">
          <h2 className="mb-5 text-xl font-semibold">Learning the basics</h2>
          <ul className="space-y-3">
            {BASICS.map((g) => (
              <GuideCard key={g.slug} {...g} />
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-xl font-semibold">Guides by service</h2>
          <p className="mb-5 text-sm leading-relaxed text-slate-400">
            Each of these covers the constraints that actually bite in that
            setting, and how to express them in GeoRoutes.
          </p>
          <ul className="space-y-3">
            {SECTORS.map((g) => (
              <GuideCard key={g.slug} {...g} />
            ))}
          </ul>
        </section>

        <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-900/30 to-slate-900/60 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Start with a real round</h2>
          <p className="mb-6 text-sm text-slate-300">
            You can build a schedule without creating an account. Free mode
            keeps everything in your browser session.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/scheduler"
              className="inline-flex items-center rounded-full bg-teal-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              Open the scheduler
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-full border border-slate-600 px-6 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              How it works
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
