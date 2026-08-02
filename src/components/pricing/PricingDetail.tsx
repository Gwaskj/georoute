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
          deciding anything. It runs entirely in your browser session: your
          staff, appointments and generated schedule are held in the tab you
          are working in and are never sent to our servers. Closing the tab
          clears them. That is also why free mode cannot carry a round from one
          day to the next — there is nowhere for it to be kept.
        </p>
        <p>
          Within a session you can add up to 2 staff and 10 appointments, which
          is enough to see how the scheduler splits work between people and how
          it handles travel between real postcodes. Every scheduling feature is
          available: skills matching, double-up calls, repeat visits with a
          minimum gap, call purposes, custom time windows and breaks.
        </p>
        <p>
          Pro removes the limits — unlimited staff and up to 100 appointments a
          day — and saves everything to the cloud, so your staff list and
          client visits are there next time on any device. It also adds the
          calendar, which is what makes recurring visits and future dates
          possible: daily or weekly patterns, an end date, and the ability to
          skip or move a single occurrence without disturbing the rest of the
          series.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-slate-100">
        Sharing rounds with staff
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Pro accounts can send a generated round to the person doing it, either
          as a read-only link that works without an account, or as a login that
          shows that staff member their own day and nothing else. Staff logins
          are included at no extra cost and there is no limit on how many you
          create — they are read-only, so they cannot change your data.
        </p>
        <p>
          Either way, the round can be opened as a multi-stop route in Google
          Maps or Apple Maps, or navigated stop by stop in Waze.
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
          If you cancel, your staff and appointment data is retained for 30
          days. Resubscribe within that period and everything is restored as it
          was. After 30 days it is permanently deleted from our servers. You
          can read the full detail in our{" "}
          <Link href="/privacy" className="text-teal-400 hover:text-teal-300">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-teal-400 hover:text-teal-300">
            terms of service
          </Link>
          .
        </p>
        <p>
          Not sure which you need? The{" "}
          <Link href="/help" className="text-teal-400 hover:text-teal-300">
            help guides
          </Link>{" "}
          walk through setting up a round, and free mode is enough to follow
          them with your own postcodes.
        </p>
      </div>
    </div>
  );
}
