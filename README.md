# GeoRoutes

Scheduling software for teams who work out in the community rather than from
one building — home care rounds, district nursing, occupational therapy and
physiotherapy caseloads.

Given a list of staff, a list of visits and the rules a service works to, it
assigns every visit to a suitable person and orders their day to keep driving
down, using real road distances rather than straight-line estimates.

Live at [www.georoutes.co.uk](https://www.georoutes.co.uk).

## What it does

- **Route-optimised scheduling** — real road distances via OpenRouteService, UK
  postcodes geocoded automatically
- **The constraints real rounds have** — skills that gate who may attend,
  double-up visits needing two staff, several visits a day to one person with a
  minimum gap between them, call purposes and custom time windows, per-staff
  working hours and unpaid breaks
- **Recurring visits** — daily or weekly patterns with an optional end date, and
  a calendar with month, week, working-week and day views where a single
  occurrence can be skipped or moved without disturbing the series
- **Getting the round to staff** — a read-only link that needs no account, or a
  staff login that shows only that person's own day. Either opens as a
  multi-stop route in Google or Apple Maps, or stop by stop in Waze
- **Free and Pro** — free mode runs entirely in the browser session, capped at 2
  staff and 10 appointments; Pro removes the limits, stores to the cloud, and
  adds the calendar

It is not a care records system. It holds no care plans, medication records or
clinical notes.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-side only, never exposed
ADMIN_EMAIL=...
TEST_USER_EMAIL=...                  # Playwright sign-in
TEST_USER_PASSWORD=...
```

`NEXT_PUBLIC_SITE_URL` is optional. It overrides the canonical origin used for
metadata, the sitemap and robots.txt; unset, it falls back to the production
domain. Note that it takes precedence over the code default, so a stale value
here silently overrides everything.

## Tests

```bash
npm test             # Playwright, needs the app running on :3000
npm run test:ui
```

The suite signs in as `TEST_USER_EMAIL` and smoke-tests every page for console
errors and failed requests. It stubs Vercel's analytics script, which exists
only on Vercel and would otherwise 404 on every page locally.

## Database

Supabase, with the schema in `supabase/`:

- `migrations/` — applied with `npx supabase db push`
- `setup.sql` — the only definition of ten tables (profiles, staff,
  appointments, routes, pricing, business_settings, site_header and the log
  tables). It is not superseded by the migrations and must not be deleted
- `page_cms.sql` — likewise the only definition of `page_content`

Row-level security is on throughout. Staff logins are read-only at the database
level: a trigger refuses writes from them regardless of policy, and middleware
keeps them out of the owner's pages.

## Deployment

Vercel, deployed from `main`. DNS is on Cloudflare in DNS-only mode — Vercel
serves directly, with apex redirecting to `www`.

Two things bite if forgotten:

- the Stripe webhook must be deployed with
  `supabase functions deploy stripe-webhook --no-verify-jwt`, or Supabase's
  gateway rejects every Stripe event with a 401 before the handler runs
- database migrations must be applied before the code that uses them, since
  saving replaces a user's rows and a failed write loses the difference
