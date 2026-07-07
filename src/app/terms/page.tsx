import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – GeoRoute",
  description: "The terms that govern use of the GeoRoute service.",
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10">
          <Section title="Agreement to terms">
            <p>
              By creating an account or using GeoRoute (&quot;the
              Service&quot;), you agree to these Terms of Service. If you do
              not agree, please do not use the Service.
            </p>
          </Section>

          <Section title="The service">
            <p>
              GeoRoute helps teams plan staff schedules and routes. We offer
              a free tier with limited features and storage, and a paid Pro
              tier with expanded limits and cloud storage. We may change or
              discontinue features at any time, and will make reasonable
              efforts to notify you of significant changes.
            </p>
          </Section>

          <Section title="Accounts">
            <p>
              You are responsible for keeping your login credentials secure
              and for all activity that occurs under your account. Notify us
              promptly if you suspect unauthorised use of your account.
            </p>
          </Section>

          <Section title="Subscriptions and billing">
            <p>
              Paid plans are billed in advance on a recurring basis through
              Stripe, our payment processor. You can view your plan, update
              payment details, or cancel at any time from the billing portal
              linked on your Account page. Cancelling stops future renewals;
              we do not provide partial refunds for unused time within a
              billing period unless required by law.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use the Service for any unlawful purpose or in violation of any applicable regulation.</li>
              <li>Attempt to disrupt, reverse engineer, or gain unauthorised access to the Service or its infrastructure.</li>
              <li>Upload data you do not have the right to use, including third-party personal data without a lawful basis.</li>
            </ul>
          </Section>

          <Section title="Your data">
            <p>
              You retain ownership of the staff, appointment, and scheduling
              data you input. We process it only to provide the Service, as
              described in our{" "}
              <a href="/privacy" className="text-teal-400 underline hover:text-teal-300">
                Privacy Policy
              </a>
              . You can request export or deletion of your data at any time.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>
              The Service relies on third-party providers — including
              Supabase, Stripe, OpenRouteService, and Google AdSense — to
              operate. We are not responsible for outages or issues
              originating from these providers, but will work to minimise
              their impact on you.
            </p>
          </Section>

          <Section title="Disclaimer and limitation of liability">
            <p>
              The Service is provided &quot;as is&quot; without warranties of
              any kind. Route and schedule suggestions are generated
              automatically and should be reviewed before relying on them
              operationally. To the maximum extent permitted by law, GeoRoute
              is not liable for indirect, incidental, or consequential
              damages arising from use of the Service.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              You may stop using the Service and cancel your subscription at
              any time. We may suspend or terminate accounts that violate
              these terms or applicable law.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms from time to time. Continued use of
              the Service after a change constitutes acceptance of the
              revised terms.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about these terms can be sent to{" "}
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
