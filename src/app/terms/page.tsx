import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern use of GeoRoutes: plans and billing, who is responsible for what, and the limits of our liability.",
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10">
          <Section title="Agreement to terms">
            <p>
              By creating an account or using GeoRoutes (&quot;the
              Service&quot;), you agree to these Terms of Service. If you do not
              agree, please do not use the Service.
            </p>
          </Section>

          <Section title="The Service">
            <p>
              GeoRoutes helps community health and care teams plan staff
              schedules and travel routes. We offer a free tier with limited
              capacity and a paid Pro tier with higher limits and additional
              features. We may change or discontinue features at any time, and
              will make reasonable efforts to notify you of significant changes.
            </p>
            <p>
              GeoRoutes is a decision-support tool. Routes and schedules are
              generated automatically from the information you provide, and are
              suggestions for a competent person to review &mdash; not
              instructions to be followed unchecked.
            </p>
          </Section>

          <Section title="Where your data lives">
            <p>
              The staff, client, postcode and schedule information you enter is
              stored in your own browser and is never transmitted to us. We do
              not hold it, cannot access it, and cannot recover it for you.
            </p>
            <p>
              Because of this, keeping a usable copy of your data is your
              responsibility. Settings provides an export; we recommend using it
              regularly. Clearing your browsing data, or a browser doing so on
              your behalf, will remove your information permanently.
            </p>
            <p>
              You retain ownership of everything you enter. Since we never
              receive it, we are not a processor of it under UK GDPR, and no
              data processing agreement is required between us for that data.
              See our{" "}
              <Link
                href="/privacy"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Privacy Policy
              </Link>{" "}
              for what we do hold.
            </p>
          </Section>

          <Section title="Your responsibilities">
            <p>
              You are responsible for keeping your login credentials secure and
              for all activity that occurs under your account. Notify us
              promptly if you suspect unauthorised use.
            </p>
            <p>As the controller of the information you enter, you are responsible for:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                having a lawful basis to hold and use the personal data you
                enter, and for informing the people it concerns;
              </li>
              <li>
                the accuracy of what you enter &mdash; a schedule built from a
                wrong postcode will send someone to the wrong door;
              </li>
              <li>
                reviewing generated schedules before relying on them
                operationally;
              </li>
              <li>
                who you send a round link to. A link contains the round and
                cannot be withdrawn once sent.
              </li>
            </ul>
          </Section>

          <Section title="Plans and billing">
            <p>
              Paid plans are billed in advance on a recurring basis through
              Stripe, our payment processor. You can view your plan, update
              payment details, or cancel at any time from the billing portal
              linked on your Account page. Cancelling stops future renewals; we
              do not provide partial refunds for unused time within a billing
              period unless required by law.
            </p>
            <p>
              Ending a subscription does not delete your scheduling data,
              because it was never on our servers. It stays in your browser and
              remains yours.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable regulation.
              </li>
              <li>
                Attempt to disrupt, reverse engineer, or gain unauthorised
                access to the Service or its infrastructure.
              </li>
              <li>
                Upload data you do not have the right to use, including
                third-party personal data without a lawful basis.
              </li>
              <li>
                Use automated means to place unreasonable load on the Service or
                on the routing providers behind it.
              </li>
            </ul>
          </Section>

          <Section title="Third-party providers">
            <p>
              The Service relies on third-party providers &mdash; including
              Cloudflare, Supabase, Stripe and OpenRouteService &mdash; to
              operate. We are not responsible for outages or issues originating
              from these providers, but will work to minimise their impact on
              you.
            </p>
          </Section>

          <Section title="Availability">
            <p>
              We aim to keep the Service available at all times but do not
              guarantee uninterrupted access, and no service level is promised
              on any plan. Maintenance, provider outages and faults will
              sometimes make it unavailable.
            </p>
            <p>
              Because your data is held in your browser rather than by us, a
              GeoRoutes outage does not put your information at risk &mdash; but
              it may prevent you generating a new schedule until it is resolved.
              Plan accordingly for days where that would matter.
            </p>
          </Section>

          <Section title="Warranties and liability">
            <p>
              The Service is provided &quot;as is&quot; without warranties of
              any kind. Route and schedule suggestions are generated
              automatically and should be reviewed before relying on them
              operationally.
            </p>
            <p>
              To the maximum extent permitted by law, GeoRoutes is not liable
              for indirect, incidental, or consequential damages arising from
              use of the Service. Our total liability arising out of or in
              connection with the Service, whether in contract, tort
              (including negligence) or otherwise, is limited to the amount you
              paid us in the twelve months preceding the event giving rise to
              the claim.
            </p>
            <p>
              Nothing in these terms limits or excludes liability for death or
              personal injury caused by negligence, for fraud or fraudulent
              misrepresentation, or for anything else that cannot lawfully be
              limited or excluded.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              You may stop using the Service and cancel your subscription at any
              time. We may suspend or terminate accounts that violate these
              terms or applicable law.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms are governed by the law of England and Wales, and the
              courts of England and Wales have exclusive jurisdiction over any
              dispute arising from them.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms from time to time. Continued use of the
              Service after a change constitutes acceptance of the revised
              terms.
            </p>
          </Section>

          <Section title="Contact">
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
