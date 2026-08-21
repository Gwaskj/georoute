import Link from "next/link";
import { SITE_URL } from "@/lib/siteUrl";
import { GUIDES, Guide } from "@/lib/help/guides";

interface GuideShellProps {
  guide: Guide;
  /** Opening paragraph. Written per page so it reads as prose, not as the meta description repeated. */
  lead: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for every help guide: breadcrumbs, heading, related links and
 * the structured data that lets search engines read the section as a set of
 * how-to articles rather than a pile of unrelated pages.
 */
export default function GuideShell({ guide, lead, children }: GuideShellProps) {
  const url = `${SITE_URL}/help/${guide.slug}`;

  // Same-category siblings first, so a nurse reading a sector guide is offered
  // the other sector guides rather than being sent back to the basics.
  const related = GUIDES.filter(
    (g) => g.slug !== guide.slug && g.category === guide.category
  ).slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Help", item: `${SITE_URL}/help` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: guide.title,
      description: guide.description,
      inLanguage: "en-GB",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      isPartOf: {
        "@type": "WebSite",
        name: "GeoRoutes",
        url: SITE_URL,
      },
      about: {
        "@type": "SoftwareApplication",
        name: "GeoRoutes",
        applicationCategory: "BusinessApplication",
      },
    },
  ];

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-slate-200">Home</Link>
            </li>
            <li aria-hidden="true" className="text-slate-600">/</li>
            <li>
              <Link href="/help" className="hover:text-slate-200">Help</Link>
            </li>
            <li aria-hidden="true" className="text-slate-600">/</li>
            <li className="text-slate-300">{guide.title}</li>
          </ol>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            {lead}
          </p>
          <p className="mt-3 text-xs uppercase tracking-widest text-slate-400">
            {guide.minutes} min read
          </p>
        </header>

        {children}

        {related.length > 0 && (
          <section className="mt-16 border-t border-slate-800 pt-8">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Related guides
            </h2>
            <ul className="space-y-3">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/help/${g.slug}`}
                    className="group flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-900"
                  >
                    <span className="text-sm font-medium text-slate-100 group-hover:text-teal-300">
                      {g.title}
                    </span>
                    <span className="text-xs leading-relaxed text-slate-400">
                      {g.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-900/30 to-slate-900/60 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Try it on your own round</h2>
          <p className="mb-6 text-sm text-slate-300">
            The scheduler is free to use with no account — your data stays in
            your browser until you choose to create one.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/scheduler"
              className="inline-flex items-center rounded-full bg-teal-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              Open the scheduler
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center rounded-full border border-slate-600 px-6 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              All help guides
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
