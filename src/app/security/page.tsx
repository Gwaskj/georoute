import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How GeoRoutes protects your data: client details never leave your browser, so there is no database of them to breach. Our architecture, controls and disclosure policy.",
  alternates: { canonical: "/security" },
};

const CONTACT_EMAIL = "support@georoutes.co.uk";
const LAST_UPDATED = "20 August 2026";

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

export default function SecurityPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Security
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-8 rounded-lg border border-teal-800/60 bg-teal-950/30 p-5">
          <p className="text-sm leading-relaxed text-slate-300">
            The strongest security control available to a scheduling tool is not
            to hold the data in the first place.{" "}
            <strong className="text-slate-100">
              Your clients&rsquo; names, addresses and visit times never reach
              our servers.
            </strong>{" "}
            There is no database of them to breach, subpoena, misconfigure or
            leak.
          </p>
        </div>

        <div className="mt-10">
          <Section title="Where data lives">
            <p>
              Everything you enter into the scheduler is held in your own
              browser, in a storage area called IndexedDB, and is never
              transmitted to us. This applies to every account, free and Pro
              alike.
            </p>
            <p>
              When your browser needs a travel time, it sends a pair of
              postcodes and nothing else &mdash; no names, no addresses, no
              account identifier. Those postcode pairs are cached so we do not
              repeat the same lookup, and the cache records nothing about who
              asked.
            </p>
          </Section>

          <Section title="Sharing a round">
            <p>
              A carer&rsquo;s round is encoded into the web link itself, after
              the &ldquo;#&rdquo; symbol. Browsers never transmit that part of a
              URL, so the round passes from your device to theirs without
              reaching our servers, our logs, or our analytics.
            </p>
            <p>
              The trade-off is honest: anyone holding the link can open it, and
              it cannot be withdrawn afterwards because there is no server-side
              record to revoke. Issue a fresh link each day and send it only to
              the person doing the round.
            </p>
          </Section>

          <Section title="What we do hold, and how it is protected">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-slate-200">Accounts.</strong> Email and
                authentication are handled by Supabase. Passwords are hashed by
                them and never seen by us.
              </li>
              <li>
                <strong className="text-slate-200">Payments.</strong> Card
                details go directly to Stripe. We hold only a customer
                reference.
              </li>
              <li>
                <strong className="text-slate-200">
                  Database access rules.
                </strong>{" "}
                Every remaining table uses row-level security, so an account can
                only ever read its own record. Administrative access is
                restricted to the account owner.
              </li>
              <li>
                <strong className="text-slate-200">Diagnostics.</strong> Error
                reports have the fragment stripped from the URL before storage,
                so a shared round can never appear in them.
              </li>
            </ul>
          </Section>

          <Section title="Transport and browser protections">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                HTTPS everywhere, with HSTS set for two years including
                subdomains. Plain HTTP is redirected before anything is served.
              </li>
              <li>
                A Content-Security-Policy restricting scripts, styles, images
                and connections to a short list of known origins.
              </li>
              <li>
                <code className="text-xs">X-Content-Type-Options</code>,{" "}
                <code className="text-xs">X-Frame-Options</code>,{" "}
                <code className="text-xs">Referrer-Policy</code> and{" "}
                <code className="text-xs">Permissions-Policy</code> set on every
                response.
              </li>
              <li>
                Pages that display a round are excluded from analytics entirely
                and marked <code className="text-xs">noindex</code>.
              </li>
            </ul>
          </Section>

          <Section title="Sub-processors">
            <p>
              We rely on Cloudflare (hosting), Supabase (authentication and our
              own records), Stripe (payments), OpenRouteService (travel times
              from postcodes) and postcodes.io (postcode validation). None of
              them receives your clients&rsquo; details, because we never have
              them to pass on.
            </p>
          </Section>

          <Section title="Reporting a vulnerability">
            <p>
              If you believe you have found a security issue, please email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-teal-400 underline hover:text-teal-300"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              with enough detail to reproduce it. Please give us a reasonable
              opportunity to fix it before disclosing it publicly.
            </p>
            <p>
              We will not pursue legal action against anyone acting in good
              faith who reports an issue, avoids privacy violations and does not
              degrade the service while testing. Please do not run automated
              scanning that places load on the site, and do not access data
              belonging to anyone but yourself.
            </p>
            <p>
              This policy is also published at{" "}
              <a
                href="/.well-known/security.txt"
                className="text-teal-400 underline hover:text-teal-300"
              >
                /.well-known/security.txt
              </a>
              .
            </p>
          </Section>

          <Section title="Honest limitations">
            <p>
              GeoRoutes is run by one person. There is no 24/7 security
              operations centre, no formal certification such as ISO 27001 or
              Cyber Essentials, and no contractual uptime guarantee. What there
              is instead is an architecture that holds as little as possible, so
              that the consequences of any failure are correspondingly small.
            </p>
            <p>
              If your organisation requires certification or a signed data
              processing agreement before adopting a supplier, please get in
              touch and we can discuss what is possible.
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
