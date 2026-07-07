import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback – GeoRoute",
  description: "Share feedback, bug reports, or feature requests for GeoRoute.",
  alternates: { canonical: "/feedback" },
};

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSevMqInlZTiesX-XYOujny8oq9iZvI67Qh6BfxRBg0YmeDTYQ/viewform?embedded=true";

export default function FeedbackPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Feedback
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Found a bug, or have an idea for GeoRoute? Let us know below.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <iframe
            src={FORM_URL}
            title="GeoRoute feedback form"
            width="100%"
            height="900"
            style={{ display: "block", border: 0 }}
            loading="lazy"
          >
            Loading…
          </iframe>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Form not loading?{" "}
          <a
            href={FORM_URL.replace("?embedded=true", "")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 underline hover:text-teal-300"
          >
            Open it in a new tab
          </a>
          .
        </p>
      </div>
    </div>
  );
}
