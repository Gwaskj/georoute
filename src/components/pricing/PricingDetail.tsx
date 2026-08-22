import Link from "next/link";

/**
 * Editorial content below the pricing cards.
 *
 * The cards alone were about thirty words, which is thin for the page most
 * likely to be searched for by name. This answers the questions people
 * actually have before paying: what the limits mean in practice, what happens
 * to their data, and how cancelling works.
 */
export default function PricingDetail() {
  return (
    <div className="mx-auto mt-16 max-w-3xl px-4 pb-16">
      <h2 className="text-xl font-semibold text-slate-100">
        What the plans actually mean
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Free mode exists so you can test GeoRoutes against a real day before
          deciding anything. No sign-up, no card: your staff, appointments and
          generated schedule are held in your own browser and are never sent to
          our servers.
        </p>
        <p>
          You can add up to 2 staff and 10 appointments, which is enough to see
          how the scheduler splits work between people and how it handles travel
          between real postcodes. Every scheduling feature is available: skills
          matching, double-up calls, repeat visits with a minimum gap, call
          purposes, custom time windows and breaks.
        </p>
        <p>
          Pro removes the limits — unlimited staff and up to 100 appointments a
          day — and adds the calendar, which is what makes recurring visits and
          future dates possible: daily or weekly patterns, an end date, and the
          ability to skip or move a single occurrence without disturbing the
          rest of the series.
        </p>
        <p>
          What Pro does <em>not</em> change is where your data lives. On every
          plan, your clients&rsquo; names and addresses stay in your browser.
          Paying more does not move them onto our servers, because we would
          rather not have them.
        </p>
        <p>
          GeoRoutes plans rounds from <strong>UK postcodes</strong> and is
          designed for use in the United Kingdom. Addresses elsewhere cannot be
          scheduled yet.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-slate-100">
        Sharing rounds with staff
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          You can send a carer their round as a read-only link that works
          without an account. The visits are carried inside the link itself
          rather than stored anywhere, so the round travels from your device to
          theirs without passing through us.
        </p>
        <p>
          That also means a link cannot be withdrawn once sent, so send a fresh
          one each day rather than relying on an old one expiring. The round can
          be opened as a multi-stop route in Google Maps or Apple Maps, or
          navigated stop by stop in Waze.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-slate-100">
        Billing and your data
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Pro is billed monthly and can be cancelled at any time from your
          account page — there is no minimum term and no cancellation fee.
          Payments are handled by Stripe; we never see or store your card
          details.
        </p>
        <p>
          Cancelling does not delete your schedules, because they were never on
          our servers — they stay in your browser either way. Keep your own
          backup using the export in Settings, since we have no copy to restore
          for you. You can read the full detail in our{" "}
          <Link href="/privacy" className="text-teal-400 underline hover:text-teal-300">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-teal-400 underline hover:text-teal-300">
            terms of service
          </Link>
          .
        </p>
        <p>
          Not sure which you need? The{" "}
          <Link href="/help" className="text-teal-400 underline hover:text-teal-300">
            help guides
          </Link>{" "}
          walk through setting up a round, and free mode is enough to follow
          them with your own postcodes.
        </p>
      </div>
    </div>
  );
}
