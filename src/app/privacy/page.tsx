import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Client names, addresses and visit times never leave your browser. What GeoRoutes does and does not hold, and why that matters under UK GDPR.",
  alternates: { canonical: "/privacy" },
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

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: {LAST_UPDATED}
        </p>

        {/* The single most important fact about this product, stated before
            anyone has to read a policy to find it. */}
        <div className="mt-8 rounded-lg border border-teal-800/60 bg-teal-950/30 p-5">
          <h2 className="text-sm font-semibold text-teal-200">
            The short version
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            <strong className="text-slate-100">
              We never receive your clients&rsquo; names, addresses or visit
              times.
            </strong>{" "}
            Everything you type into the scheduler stays in your own browser. It
            is not uploaded, not stored on our servers, and not something we
            could hand over, lose in a breach, or read if we wanted to.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            What we do hold is your own account: an email address, your
            subscription status, and anonymous usage counts.
          </p>
        </div>

        <div className="mt-10">
          <Section title="Overview">
            <p>
              GeoRoutes (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
              provides route planning and scheduling software for community
              health and care teams. This policy explains what information we
              collect when you use georoutes.co.uk, how we use it, and the
              choices available to you.
            </p>
          </Section>

          <Section title="Your clients' and staff details stay on your device">
            <p>
              The staff, clients, postcodes, visit times and generated schedules
              you enter are held only in the browser you entered them in, using
              a storage area called IndexedDB. They are never transmitted to us
              and we have no way to access them.
            </p>
            <p>
              This applies to every account, free and Pro alike. Paying for Pro
              raises your limits and unlocks features; it does not move your
              data onto our servers.
            </p>
            <p>
              There are two practical consequences worth understanding. Your
              data does not sync between devices or browsers &mdash; a schedule
              built on your laptop is not on your phone. And if you clear your
              browsing data, the information is gone, because there is no copy
              elsewhere to restore from. Use the export option in Settings to
              keep a backup and to move to a new machine.
            </p>
            <p>
              Because we never receive this information, we are not a
              &ldquo;processor&rdquo; of it under UK GDPR. You remain the
              controller of your clients&rsquo; data throughout, and you do not
              need a data processing agreement with us in order to use
              GeoRoutes.
            </p>
          </Section>

          <Section title="What we do collect">
            <p>
              <strong className="text-slate-200">Account information.</strong>{" "}
              When you create an account we collect your email address and
              authentication details via our identity provider, Supabase.
            </p>
            <p>
              <strong className="text-slate-200">Payment information.</strong>{" "}
              Subscription payments are processed by Stripe. We do not store
              your card details &mdash; Stripe provides us with a customer and
              subscription reference so we can manage your plan.
            </p>
            <p>
              <strong className="text-slate-200">Usage counts.</strong> When a
              schedule is generated we record how many staff and appointments
              were involved and how long it took, so we can tell whether the
              scheduler is working. These records contain no names, no
              addresses and no postcodes.
            </p>
            <p>
              <strong className="text-slate-200">Error reports.</strong> If
              something breaks, your browser sends us the error message and the
              page it happened on so we can fix it. The part of a web address
              after a &ldquo;#&rdquo; is removed before the report is stored,
              because that is where a shared round travels.
            </p>
            <p>
              <strong className="text-slate-200">
                Travel times between postcodes.
              </strong>{" "}
              To avoid asking our routing provider the same question repeatedly,
              we keep a table of how long it takes to travel between two
              postcodes. It records the pair of postcodes, the distance and the
              duration &mdash; and nothing about who asked or when. Entries are
              deleted automatically after a month without use.
            </p>
          </Section>

          <Section title="Sharing a round with a carer">
            <p>
              When you send a carer their round for the day, the visits are
              encoded into the web link itself, after the &ldquo;#&rdquo;
              symbol. Browsers never send that part of a link to a server, so
              the round travels from your device to theirs without passing
              through us. There is no copy on our systems.
            </p>
            <p>
              Two things follow from that. Anyone holding the link can open it,
              so send it only to the person doing the round. And because there
              is no server-side record, a link cannot be withdrawn once sent
              &mdash; issue a fresh one each day rather than relying on an old
              one expiring.
            </p>
          </Section>

          <Section title="Cookies and analytics">
            <p>
              <strong className="text-slate-200">Cookies.</strong> We use
              cookies to keep you signed in and to remember your preferences.
              These are necessary for the service to work and are not used for
              advertising. GeoRoutes shows no advertising and sets no
              advertising cookies.
            </p>
            <p>
              <strong className="text-slate-200">Analytics.</strong> We use
              Google Analytics to count page visits and see which pages are
              read. In the UK, the EEA and Switzerland we ask before it stores
              anything: until you accept, it runs with storage denied and sets
              no cookie or identifier on your device. If you decline, or ignore
              the banner, it stays that way and the site works identically
              &mdash; we simply count less precisely. You can change your answer
              at any time using the Cookie settings link in the footer.
            </p>
            <p>
              Analytics is switched off entirely on the page that displays a
              carer&rsquo;s round, so that a shared round is never measured.
            </p>
            <p>
              We do not use Google Analytics for advertising. The advertising
              permissions in the tag are refused permanently and are never
              enabled by accepting analytics.
            </p>
          </Section>

          <Section title="How we use information">
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide, operate, and maintain the scheduling service.</li>
              <li>
                To calculate travel times from the postcodes your browser sends
                to our routing provider. Only postcodes are sent &mdash; never
                names or addresses.
              </li>
              <li>
                To process subscription payments and manage your plan via
                Stripe.
              </li>
              <li>
                To communicate with you about your account or changes to our
                service.
              </li>
            </ul>
          </Section>

          <Section title="Who we share information with">
            <p>
              We share information with the following providers solely to
              operate the service:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-slate-200">Supabase</strong> &mdash;
                authentication, our own account records, and website content.
              </li>
              <li>
                <strong className="text-slate-200">Stripe</strong> &mdash;
                subscription billing and payment processing.
              </li>
              <li>
                <strong className="text-slate-200">OpenRouteService</strong>{" "}
                &mdash; travel-time calculation from postcodes alone.
              </li>
              <li>
                <strong className="text-slate-200">postcodes.io</strong> &mdash;
                checking that a UK postcode exists when you enter one.
              </li>
              <li>
                <strong className="text-slate-200">Google Analytics</strong>{" "}
                &mdash; page-visit counts, storing nothing on your device unless
                you accept.
              </li>
              <li>
                <strong className="text-slate-200">Cloudflare</strong> &mdash;
                hosting and content delivery, plus traffic measurement performed
                at their network rather than in your browser, which sets nothing
                on your device.
              </li>
            </ul>
            <p>
              None of these providers receives your clients&rsquo; names or
              addresses, because we never have them to pass on.
            </p>
          </Section>

          <Section title="Retention">
            <p>
              We retain your account record for as long as your account is
              active. Usage counts and error reports are kept while they remain
              useful for diagnosing problems. Cached travel times between
              postcodes are deleted after a month without use.
            </p>
            <p>
              Your scheduling data has no retention period here because we never
              hold it. It remains on your device until you delete it, and
              removing your account does not remove it &mdash; clear it from the
              browser, or use Settings to clear it directly.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You may request access to, correction of, or deletion of the
              personal data we hold about you by emailing us at the address
              below. You can change your account password at any time from the
              Account page, and manage or cancel your subscription from the
              billing portal linked there.
            </p>
            <p>
              For your scheduling data, these rights sit in your hands rather
              than ours: export it, correct it or delete it yourself from
              Settings, at any time and without asking us.
            </p>
            <p>
              If you are unhappy with how we have handled your personal data,
              you can complain to the Information Commissioner&rsquo;s Office at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline hover:text-teal-300"
              >
                ico.org.uk
              </a>
              .
            </p>
          </Section>

          <Section title="Children">
            <p>
              GeoRoutes is a business scheduling tool and is not directed at
              children. We do not knowingly collect information from anyone
              under 16.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes will
              be reflected by updating the &quot;Last updated&quot; date above.
            </p>
          </Section>

          <Section title="Contact">
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
            <p>
              See also our{" "}
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
