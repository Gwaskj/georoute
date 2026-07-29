import { ReactNode } from "react";

export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-8">
      <h2 className="mb-5 text-xl font-semibold text-slate-100">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </section>
  );
}

/** Numbered walkthrough, matching the step styling used on /how-it-works. */
export function Steps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <ol className="space-y-7">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-5">
          <span className="shrink-0 text-2xl font-bold tabular-nums text-teal-500">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="mb-1 font-semibold text-slate-100">{step.title}</h3>
            <p className="text-sm leading-relaxed text-slate-300">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Field-by-field reference, for guides that walk through a form. */
export function FieldList({
  fields,
}: {
  fields: { name: string; body: string }[];
}) {
  return (
    <dl className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
      {fields.map((f) => (
        <div key={f.name} className="px-5 py-4">
          <dt className="mb-1 text-sm font-semibold text-slate-100">{f.name}</dt>
          <dd className="text-sm leading-relaxed text-slate-300">{f.body}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-5 py-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-400">
        {title}
      </p>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

/**
 * FAQ block plus the FAQPage structured data for it. Rendering both from one
 * array means the markup and the schema can never disagree — which matters,
 * because Google treats mismatched FAQ schema as a spam signal.
 */
export function FaqSection({
  faqs,
  heading = "Frequently asked questions",
}: {
  faqs: { q: string; a: string }[];
  heading?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mb-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="mb-6 text-xl font-semibold text-slate-100">{heading}</h2>
      <dl className="space-y-6">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="mb-1 font-medium text-slate-100">{f.q}</dt>
            <dd className="text-sm leading-relaxed text-slate-300">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
