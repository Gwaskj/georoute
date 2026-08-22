import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "How accessible GeoRoutes is, what we have tested, what we know is not yet right, and how to tell us about a barrier.",
  alternates: { canonical: "/accessibility" },
};

const CONTACT_EMAIL = "support@georoutes.co.uk";
const LAST_UPDATED = "22 August 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-base font-semibold text-slate-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </section>
  );
}

export default function AccessibilityPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Accessibility
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10">
          <Section title="Our aim">
            <p>
              GeoRoutes should be usable by everyone who needs to plan a round,
              including people using a keyboard alone, a screen reader, or
              magnification. We aim to meet the{" "}
              <a
                href="https://www.w3.org/TR/WCAG22/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Web Content Accessibility Guidelines 2.2
              </a>{" "}
              at level AA.
            </p>
          </Section>

          <Section title="How honest this statement is">
            <p>
              We are not claiming full conformance, because we have not carried
              out the independent audit that such a claim requires. What we have
              done is run automated checks on every public page as part of our
              test suite, so that a serious or critical issue fails the build
              rather than shipping quietly.
            </p>
            <p>
              Automated testing catches roughly a third of accessibility
              problems. It cannot tell whether a description is meaningful or
              whether a flow makes sense when read aloud. Treat a clean result
              as a floor rather than a guarantee.
            </p>
          </Section>

          <Section title="What should work well">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                All content pages &mdash; home, pricing, how it works, the help
                guides and these policies &mdash; are plain semantic HTML with
                headings in order.
              </li>
              <li>
                A carer&rsquo;s round is rendered on the server as a plain list
                with ordinary links, so it works before any JavaScript loads and
                reads sensibly on a phone with a screen reader.
              </li>
              <li>
                Colour is never the only way information is conveyed; times,
                labels and warnings are always written out as text.
              </li>
              <li>
                Text can be resized and the layout reflows down to a narrow
                phone screen without horizontal scrolling.
              </li>
              <li>
                Every interactive element shows a visible focus ring, and a
                &ldquo;skip to main content&rdquo; link appears on first tab so
                the navigation does not have to be traversed on every page.
              </li>
              <li>
                Each staff member&rsquo;s round in the results list is a
                standard expand-and-collapse control, announcing whether it is
                open, with the round itself outside the button rather than
                nested inside it.
              </li>
              <li>
                A request for reduced motion is respected: animations and
                transitions are effectively disabled.
              </li>
            </ul>
          </Section>

          <Section title="Known problems">
            <p>
              These are the barriers we are aware of. Naming them is more useful
              than a statement that implies there are none.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-slate-200">The map is visual.</strong>{" "}
                Route lines and pins convey information that is only available
                by looking. The same schedule is always available as a text list
                alongside it, which is the accessible route through the same
                information.
              </li>
              <li>
                <strong className="text-slate-200">
                  The feedback form is a third party.
                </strong>{" "}
                It is a Google Form embedded in the page, and its accessibility
                is Google&rsquo;s rather than ours. If it causes difficulty,
                email us instead and we will treat that as equivalent.
              </li>
              <li>
                <strong className="text-slate-200">
                  Drag interactions in the calendar
                </strong>{" "}
                have keyboard equivalents, but they are not yet documented
                anywhere obvious.
              </li>
            </ul>
          </Section>

          <Section title="Telling us about a barrier">
            <p>
              If something prevents you using GeoRoutes, please email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-teal-400 underline hover:text-teal-300"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and describe what you were trying to do. Tell us which browser and
              assistive technology you use if you know. We will reply, and we
              will tell you plainly whether and when we can fix it.
            </p>
            <p>
              If you need information from this site in another format, ask and
              we will provide it.
            </p>
          </Section>

          <Section title="Enforcement">
            <p>
              If you are not happy with our response, the Equality Advisory and
              Support Service (EASS) can advise you. GeoRoutes is a private
              business rather than a public sector body, so the Public Sector
              Bodies Accessibility Regulations 2018 do not apply to this site
              &mdash; but the Equality Act 2010 does, and we take it seriously.
            </p>
          </Section>

          <Section title="Related">
            <p>
              See also our{" "}
              <Link
                href="/privacy"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Privacy Policy
              </Link>
              ,{" "}
              <Link
                href="/security"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Security
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Terms of Service
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
