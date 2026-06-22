import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – GeoRoute",
  description: "How GeoRoute collects, uses, and protects your information.",
};

const CONTACT_EMAIL = "support@georoute.app";
const LAST_UPDATED = "18 June 2026";

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

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10">
          <Section title="Overview">
            <p>
              GeoRoute (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides
              route planning and scheduling software. This policy explains
              what information we collect when you use georoute.app, how we
              use it, and the choices available to you.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>
              <strong className="text-slate-100">Account information.</strong>{" "}
              When you create an account we collect your email address and
              authentication details via our identity provider, Supabase.
            </p>
            <p>
              <strong className="text-slate-100">Service data.</strong> If you
              use the scheduler, we store the staff, appointment, postcode,
              and schedule information you enter so the app can generate and
              display your routes. Free-tier usage may instead be stored only
              in your browser session and never reach our servers.
            </p>
            <p>
              <strong className="text-slate-100">Payment information.</strong>{" "}
              Subscription payments are processed by Stripe. We do not store
              your card details — Stripe provides us with a customer and
              subscription reference so we can manage your plan.
            </p>
            <p>
              <strong className="text-slate-100">
                Cookies and similar technologies.
              </strong>{" "}
              We use cookies to keep you signed in and to remember your
              preferences. Pages that show advertising also set cookies as
              described in &quot;Advertising&quot; below.
            </p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide, operate, and maintain the scheduling service.</li>
              <li>To calculate routes via our routing provider (OpenRouteService).</li>
              <li>To process subscription payments and manage your plan via Stripe.</li>
              <li>To communicate with you about your account or changes to our service.</li>
              <li>To show advertising to free-tier users, as described below.</li>
            </ul>
          </Section>

          <Section title="Advertising">
            <p>
              GeoRoute uses Google AdSense to show advertising to users on
              our free plan. Google, as a third-party vendor, uses cookies
              (including the DoubleClick DART cookie) to serve ads based on
              your visits to this and other websites.
            </p>
            <p>
              You can opt out of personalised advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Google&apos;s Ads Settings
              </a>
              , or learn more about how Google uses information from sites
              that use its services at{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline hover:text-teal-300"
              >
                policies.google.com/technologies/partner-sites
              </a>
              . Paying subscribers are not shown ads.
            </p>
          </Section>

          <Section title="Third-party service providers">
            <p>We share information with the following providers solely to operate the service:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-slate-100">Supabase</strong> — authentication, database, and file storage.</li>
              <li><strong className="text-slate-100">Stripe</strong> — subscription billing and payment processing.</li>
              <li><strong className="text-slate-100">OpenRouteService (ORS)</strong> — route and travel-time calculation from the postcodes you provide.</li>
              <li><strong className="text-slate-100">Google AdSense</strong> — advertising on free-tier pages.</li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>
              We retain account and service data for as long as your account
              is active. You can request deletion of your account and
              associated data at any time by contacting us.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You may request access to, correction of, or deletion of your
              personal data by emailing us at the address below. You can
              change your account password at any time from the Account
              page, and manage or cancel your subscription from the billing
              portal linked there.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              GeoRoute is a business scheduling tool and is not directed at
              children. We do not knowingly collect information from anyone
              under 16.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes
              will be reflected by updating the &quot;Last updated&quot; date
              above.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy or your data can be sent to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-teal-400 underline hover:text-teal-300"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
